// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
var userDocRef;
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      console.log('signin success (remove callback and redirect to homepage instead)');

      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function() {
        console.log('it worked?');
      }).catch(function(error) {
        console.error(error);
      });
    },
    uiShown: function() {
      mbhtm.style.display = "block";
      prld.style.display = "none";
    },credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  },
  //signInFlow: 'redirect',
  signInSuccessUrl: 'pages/home',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    //firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    //firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

function getUserDocRef(userId, successFunction) {
  var someUserDocRef;
  var query = firebase.firestore().collection('users').where("uid", "==", userId).limit(1);
  var userDocId;
  query.get().then(function(querySnapshot) {
    if (!querySnapshot.empty) {
      querySnapshot.forEach(function(documentSnapshot) {
        userDocId = documentSnapshot.id;
        someUserDocRef = firebase.firestore().collection('users').doc(userDocId);
        successFunction(1, someUserDocRef);
      });
    } else {
      successFunction(2, someUserDocRef);
    }
  }).catch(function(error) {
    console.error("error getting user doc reference " + error);
    successFunction(0, someUserDocRef);
  });
}

var doc = window.document;

function toggleFullScreen() {
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (isFs()) {
    fsbtn.style.display = 'block';
    requestFullScreen.call(docEl);
    if (isFs())
      fsbtn.style.display = 'none';
  } else {
    cancelFullScreen.call(doc);
    fsbtn.style.display = 'block';
  }
}

function updateFsBtn() {
  if (isFs())
    fsbtn.style.display = 'block';
}

function isFs() {
  return !doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement;
}

function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function signOut() {
  firebase.auth().signOut();
}

// The start method will wait until the DOM is loaded.
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log('re-signin success');
    getUserDocRef(firebase.auth().currentUser.uid, function(successCode, result) {
      if (!successCode) {
        showScreen(1);
        alert('you got auto logged in, but have no account??????')
        mbhtm.style.display = "block";
        prld.style.display = "none";
        console.log('user signing in for the first time??? (or error) ' + successCode);
        return false;
      } else {
        userDocRef = result;
        userDocRef.update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          profilePicUrl: getProfilePicUrl(),
        });
        showScreen(3);
        mbhtm.style.display = "block";
        prld.style.display = "none";
        console.log('welcome back... auto');
        getUserProfile();
      }
    });
  }else{
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});

var mbhtm = document.getElementById('mainBody');
var prld = document.getElementById('pre_loader');
var fsbtn = document.getElementById('fsbtn1');
