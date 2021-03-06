// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
var userDocRef;
var uiConfig = {
  callbacks: {
    uiShown: softHideDocs(0),
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  },
  //signInFlow: 'redirect',
  signInSuccessUrl: '/app',
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

var fdoc = window.document;

function toggleFullScreen() {
  var docEl = fdoc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = fdoc.exitFullscreen || fdoc.mozCancelFullScreen || fdoc.webkitExitFullscreen || fdoc.msExitFullscreen;

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


function isFs() {
  return !doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement;
}

function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function signOut() {
  firebase.auth().signOut();
  window.location.replace("/app/");
}

// The start method will wait until the DOM is loaded.
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log('re-signin success');
    getUserDocRef(firebase.auth().currentUser.uid, function(successCode, result) {
      if (successCode == 0 || successCode == 2) {
        console.log('no account has been created yet')
        softHideDocs(1);
        console.log('user signing in for the first time (or error) ' + successCode);
      } else {
        userDocRef = result;
        userDocRef.update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          profilePicUrl: getProfilePicUrl(),
        });
        softHideDocs(3);
        console.log('welcome back... auto');
        getUserProfile();
      }
    });
  } else {
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});

var mbhtm = document.getElementById('mainBody');
var prld = document.getElementById('pre_loader');

function softHideDocs(s) {
  mbhtm = document.getElementById('mainBody');
  prld = document.getElementById('pre_loader');
  prld.classList.add('fade');
  setTimeout(function() {
    mbhtm.style.opacity = 1;
    mbhtm.style.display = "block";
    prld.style.display = "none";
    console.log('showing the main body');
    showScreen(s);
  }, 500);
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/app/sw.js').then(function(registration) {
    console.log('ServiceWorker registration successful with scope:', registration.scope);
  }).catch(function(error) {
    console.log('ServiceWorker registration failed:', error);
  });
}
