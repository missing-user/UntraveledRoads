function getUserName() {
  return firebase.auth().currentUser.displayName;
}

function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function signOut() {
  firebase.auth().signOut();
}

function postPicSelected(event) {
  onMediaFileSelected(event, 'postImages');
}

function onMediaFileSelected(event, coll) {
  event.preventDefault();
  var file = event.target.files[0];
  console.log('file uploaded');
  // Clear the selection in the file picker input.
  //imageFormElement.reset();

  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    console.error('only images can be uploaded');
    return;
  }
  if (checkSignedInWithMessage()) {
    saveImageFile(file, coll);
  }
}

var LOADING_IMAGE_URL = 'https://loading.io/spinners/typing/lg.-text-entering-comment-loader.gif';
var lastPostImage = '';

function saveImageFile(file, coll) {
  firebase.firestore().collection(coll).add({
    name: getUserName(),
    imageUrl: LOADING_IMAGE_URL,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(uploadRef) {
    var filePath = firebase.auth().currentUser.uid + '/' + uploadRef.id + '/' + file.name;
    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
      return fileSnapshot.ref.getDownloadURL().then((url) => {
        lastPostImage = url;
        return uploadRef.update({
          imageUrl: url,
          storageUri: fileSnapshot.metadata.fullPath
        });
      });
    });
  }).catch(function(error) {
    console.error('There was an error uploading a file to Cloud Storage:', error);
  });
}

function submitFct() {
  console.log('user info submitted');
  firebase.firestore().collection('users').add({
    firstName: fnameInput.value,
    lastName: lnameInput.value,
    uid: firebase.auth().currentUser.uid,
    language: languageInput.value,
    address: addressInput.value,
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    profilePicUrl: getProfilePicUrl(),
    willingToMeet: travelConnectChk.value == "on",
  });
  showScreen(2);
}

function postFct() {
  console.log('post submitted');
  firebase.firestore().collection('posts').add({
    title: titleInput.value,
    uid: firebase.auth().currentUser.uid,
    rating: 5,
    imageUrl: lastPostImage,
    text: postTextInput.value,
    secrets: secretInput.value,
    locationHash: secretInput.value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  showScreen(3);
}

function enableButton() {
  if (lnameInput.value && fnameInput.value && addressInput.value && languageInput.value) {
    submitBtn.removeAttribute('disabled');
  } else {
    submitBtn.setAttribute('disabled', 'true');
  }
}

function checkSignedInWithMessage() {
  if (isUserSignedIn()) {
    return true;
  }
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  console.error('How are you here, without signing in??? \n' + data)
  return false;
}

function switchToSearchFct() {
  showScreen(3);
}

function switchToAboutFct() {
  showScreen(4);
  loadNewPost();
}

function hasUserPosted() {
  var query = firebase.firestore().collection('posts').where("uid", "==", firebase.auth().currentUser.uid).limit(1);
  query.get().then(function(querySnapshot) {
    if (!querySnapshot.empty) {
      return false;
    } else {
      return true;
    }
  });
}

function switchToChatFct() {
  if (hasUserPosted()) {
    showScreen(5)
  } else {
    console.log("you have to post before chatting with people");
  };
}

function loadNewPost() {
  var query = firebase.firestore().collection('posts').orderBy('rating', 'desc').limit(12);
  query.get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        console.log(doc.id, " => ", doc.data());
        const div = document.createElement('div');
        div.className = 'row';
        var tstImg = "<img src=" + doc.get("imageUrl") + " />";
        div.innerHTML = createPostHtml(10, tstImg);
        pagePost.appendChild(div);
      });
    })
    .catch(function(error) {
      console.log("Error getting documents: ", error);
    });
}

function getUserInfo(uid) {
  var query = firebase.firestore().collection('users').where("uid", "==", uid).limit(1);
  query.get().then(function(doc) {
      console.log(doc.id, " => ", doc.data());
      const div = document.createElement('div');
      div.className = 'userInfo';
      var profilePicName = "<img src=" + doc.get(profilePicUrl) + " /><h4>" + doc.get(firstName) + " " + doc.get(lastName) + "</h4>";
      div.innerHTML = userHtml(10, profilePicName);
      pagePost.appendChild(div);
    })
    .catch(function(error) {
      console.log("Error getting documents: ", error);
    });
}

function showScreen(s) {
  signinForm.style.display = "none";
  accountForm.style.display = "none";
  postingSpots.style.display = "none";
  searchScreen.style.display = "none";
  aboutScreen.style.display = "none";
  chatScreen.style.display = "none";
  switch (s) {
    case 0:
      signinForm.style.display = "block";
      break;
    case 1:
      accountForm.style.display = "block";
      break;
    case 2:
      postingSpots.style.display = "block";
      break;
    case 3:
      searchScreen.style.display = "block";
      break;
    case 4:
      aboutScreen.style.display = "block";
      break;
    case 5:
      chatScreen.style.display = "block";
      break;
    default:
      aboutScreen.style.display = "block";

  }
}

var fnameInput = document.getElementById('first_name_input');
var lnameInput = document.getElementById('last_name_input');
var languageInput = document.getElementById('language_input');
var travelConnectChk = document.getElementById('traveler_connect_input');
var addressInput = document.getElementById('address_input');
var signIn = document.getElementById('sign_in');

var submitBtn = document.getElementById('submit_btn');
var searchBtn = document.getElementById('search_btn');
var accountForm = document.getElementById('accountForm');
var searchScreen = document.getElementById('searchScreen');
var chatScreen = document.getElementById('chatScreen');
var postingSpots = document.getElementById('postingSpots');
var postBtn = document.getElementById("post_btn");
var postTextInput = document.getElementById("post_txt_input");
var titleInput = document.getElementById("title_input");
var secretInput = document.getElementById("secret_txt_input");
var pagePost = document.getElementById("page-post");

//postingSpots
var postImages = {};

var postPicUpload = document.getElementById("upload_post_pic");
postPicUpload.onchange = function() {
  console.log('insert the current image name into a header element here');
};


//add event listeners
postPicUpload.addEventListener('change', postPicSelected);

lnameInput.addEventListener('keyup', enableButton);
lnameInput.addEventListener('change', enableButton);
fnameInput.addEventListener('keyup', enableButton);
fnameInput.addEventListener('change', enableButton);
addressInput.addEventListener('keyup', enableButton);
addressInput.addEventListener('change', enableButton);
languageInput.addEventListener('keyup', enableButton);
languageInput.addEventListener('change', enableButton);

// Remove the warning about timstamps change.
var firestore = firebase.firestore();
showScreen(0);
//var settings = {};
//firestore.settings(settings);

function userHtml(postId, testImg) {
  return `
    <div class="fp-post mdl-cell mdl-cell--12-col mdl-cell--8-col-tablet
                mdl-cell--8-col-desktop mdl-grid mdl-grid--no-spacing">
      <div class="mdl-card mdl-shadow--2dp mdl-cell
                  mdl-cell--12-col mdl-cell--12-col-tablet mdl-cell--12-col-desktop">
                  <h4>this is post number ${postId}</h4>
        <div class="fp-header">
            <div class="fp-avatar">${testImg}</div>
            <div class="fp-username mdl-color-text--black"></div>
        </div>
        <div class="fp-image"></div>
      </div>
    </div>`;
}

function createPostHtml(postId, testImg) {
  return `
      <div class="fp-post mdl-cell mdl-cell--12-col mdl-cell--8-col-tablet
                  mdl-cell--8-col-desktop mdl-grid mdl-grid--no-spacing">
        <div class="mdl-card mdl-shadow--2dp mdl-cell
                    mdl-cell--12-col mdl-cell--12-col-tablet mdl-cell--12-col-desktop">
                    <h4>this is post number ${postId}</h4>
          <div class="fp-header">
              <div class="fp-avatar">${testImg}</div>
              <div class="fp-username mdl-color-text--black"></div>
          </div>
          <div class="fp-image"></div>
        </div>
      </div>`;
}

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.sidenav');
  var instances = M.Sidenav.init(elems, {
  });
});
