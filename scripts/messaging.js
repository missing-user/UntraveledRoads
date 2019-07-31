// Saves a new message on the Cloud Firestore.
function saveMessage(messageText) {
  // Add a new message entry to the Firebase database.
  return firebase.firestore().collection('messages').add({
    name: getUserName(),
    text: messageText,
    profilePicUrl: getProfilePicUrl(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(error) {
    console.error('Error writing new message to Firebase Database', error);
  });
}

function onMessageFileSelected(event) {
  console.log('its being triggered')
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  imageFormElement.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (checkSignedInWithMessage()) {
    saveImageMessage(file);
  }
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
  var query = firebase.firestore().collection('messages').orderBy('timestamp', 'desc').limit(20);

  console.log("now loading messages");
  //TODO figure out if subscription is being taken care of, or if it stays alive

  // Start listening to the query.
  query.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteMessage(change.doc.id);
      } else {
        var message = change.doc.data();
        displayMessage(change.doc.id, message.timestamp, message.name,
          message.text, message.profilePicUrl, message.imageUrl);
      }
    });
  });
}

function loadUsers() {
  while (usersList.firstChild) {
    usersList.removeChild(usersList.firstChild);
  }

  var query = firebase.firestore().collection('users').where('willingToMeet', '==', true).limit(20);

  console.log("now loading users");
  // Start listening to the query.
  query.get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        const liElement = document.createElement('li');
        liElement.className = 'collection-item avatar';
        liElement.innerHTML = userListHTML(doc.get('profilePicUrl'), doc.get("firstName") + ' ' + doc.get("lastName"), 'start chatting now');
        usersList.appendChild(liElement);

        document.getElementById(doc.id).onclick = function() {
          postSelected(this.id);
        };



      });
    })
    .catch(function(error) {
      console.error("Error getting user documents: ", error);
    });
}

function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
  var divy = document.getElementById(id);
  // If an element for that message does not exists yet we create it.
  if (!divy) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    divy = container.firstChild;
    divy.setAttribute('id', id);
    divy.setAttribute('timestamp', timestamp);
    for (var i = 0; i < messageListElement.children.length; i++) {
      var child = messageListElement.children[i];
      var time = child.getAttribute('timestamp');
      if (time && time > timestamp) {
        break;
      }
    }
    messageListElement.insertBefore(divy, child);
  }
  if (picUrl) {
    divy.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }
  divy.querySelector('.name').textContent = name;
  var messageElement = divy.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUrl) { // If the message is an image.
    var image = document.createElement('img');
    image.className = 'responsive-img materialboxed';
    image.addEventListener('load', function() {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    image.src = imageUrl + '&' + new Date().getTime();
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
    M.Materialbox.init(image, {});
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {
    divy.classList.add('visible')
  }, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

function deleteMessage(id) {
  var divy = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (divy) {
    divy.parentNode.removeChild(divy);
  }
}

function saveImageMessage(file) {
  // 1 - We add a message with a loading icon that will get updated with the shared image.
  firebase.firestore().collection('messages').add({
    name: getUserName(),
    imageUrl: LOADING_IMAGE_URL,
    profilePicUrl: getProfilePicUrl(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(messageRef) {
    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
      // 3 - Generate a public URL for the file.
      return fileSnapshot.ref.getDownloadURL().then((url) => {
        // 4 - Update the chat message placeholder with the image’s URL.
        return messageRef.update({
          imageUrl: url,
          storageUri: fileSnapshot.metadata.fullPath
        });
      });
    });
  }).catch(function(error) {
    console.error('There was an error uploading a file to Cloud Storage:', error);
  });
}

function resetMaterialTextfield(element) {
  element.value = '';
}

// Template for messages.
var MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
      'Make sure you go through the codelab setup instructions and make ' +
      'sure you are running the codelab using `firebase serve`');
  }
}

function onMessageFormSubmit() {
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function() {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}

function toggleButton() {
  if (messageInputElement.value) {
    //submitButtonElement.removeAttribute('disabled');
    submitButtonElement.style.display = 'block';
  } else {
    //submitButtonElement.setAttribute('disabled', 'true');
    submitButtonElement.style.display = 'none';
  }
}
checkSetup();

var messageListElement = document.getElementById('messages');
var messageInputElement = document.getElementById('chatInput');
var submitButtonElement = document.getElementById('send_btn');
var mediaCaptureElem = document.getElementById('mediaCapture');
var imageFormElement = document.getElementById('image-form');
var usersList = document.getElementById('availableUsersList');
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

mediaCaptureElem.addEventListener('change', onMessageFileSelected);

function userListHTML(imgSrc, name, desc) {
  return `
    <img src=${imgSrc} class="circle">
    <span class="title">
      <b1>${name}</b1>
    </span> <br>
    <b2>${desc}</b2>`;
}
