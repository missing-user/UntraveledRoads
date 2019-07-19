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

function authStateObserver(user) {
  console.log('authStateObserver has been called');
  if (user) {
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    //TODO: add user picture and username in the menue !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;
  }
}
function profilePicSelected(event){
   onMediaFileSelected(event, 'profileImages');
}

function postPicSelected(event){
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
    name:  getUserName(),
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
    uid:  firebase.auth().currentUser.uid,
    language: languageInput.value,
    address: addressInput.value,
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  });
  showScreen(2);
}

function postFct() {
  console.log('post submitted');
  firebase.firestore().collection('posts').add({
    title: titleInput.value,
    uid:  firebase.auth().currentUser.uid,
    rating: 5,
    secrets: secretInput.value,
    imageUrl: lastPostImage,
    text: postTextInput.value,
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
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  console.error('How are you here, without signing in??? \n'+ data)
  return false;
}

function switchToSearchFct(){
  showScreen(3);
}
function switchToAboutFct(){
  showScreen(4);
loadNewPost();
}

function loadNewPost(){
    var query = firebase.firestore().collection('posts').orderBy('rating', 'desc').limit(12);
    query.get().then(function(querySnapshot) {
querySnapshot.forEach(function(doc) {
      console.log(doc.id, " => ", doc.data());
      const div = document.createElement('div');
      div.className = 'row';
      var tstImg = "<img src="+ doc.get("imageUrl")+" />";
      div.innerHTML = createPostHtml(10, tstImg);
      pagePost.appendChild(div);
        });
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
   });
}

function showScreen(s){
  signinForm.style.display = "none";
  accountForm.style.display = "none";
  postingSpots.style.display = "none";
  searchScreen.style.display = "none";
  aboutScreen.style.display = "none";
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
    default:  aboutScreen.style.display = "block";

  }
}

var fnameInput = document.getElementById('first_name_input');
var lnameInput = document.getElementById('last_name_input');
var languageInput = document.getElementById('language_input');
var travelConnectChk = document.getElementById('traveler_connect_input');
var addressInput = document.getElementById('address_input');
var signIn = document.getElementById('sign_in');

var profilePicUpload = document.getElementById('profile_pic_upload')
var submitBtn = document.getElementById('submit_btn');
var searchBtn = document.getElementById('search_btn');
var accountForm = document.getElementById('accountForm');
var searchScreen = document.getElementById('searchScreen');
var postingSpots = document.getElementById('postingSpots');
var postBtn = document.getElementById("post_btn");
var postTextInput = document.getElementById("post_txt_input");
var titleInput = document.getElementById("title_input");
var secretInput = document.getElementById("secret_txt_input");
var pagePost = document.getElementById("page-post");

//postingSpots
var postImages = {};

var postPicUpload = document.getElementById("upload_post_pic");
postPicUpload.onchange = function () {
  console.log('insert the current image name into a header element here');
    };


//add event listeners
profilePicUpload.addEventListener('change', profilePicSelected);
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
