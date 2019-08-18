// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
var userDocRef;
var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        console.log('signin success');
        getUserDocRef(firebase.auth().currentUser.uid, function(successCode, result) {
          if (!successCode) {
            showScreen(1);
            console.log('user signing in for the first time (or error) ' + successCode);
            return false;
          } else {
            userDocRef = result;
            userDocRef.update({
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              profilePicUrl: getProfilePicUrl(),
            });
            showScreen(2);
            console.log('welcome back');
            getUserProfile();
          }
        });
    },
    uiShown: function() {
      mbhtm.style.display = "block";
      prld.style.display = "none";
    }
  },
  signInFlow: 'popup',
  signInSuccessUrl: '<url-to-redirect-to-on-success>',
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

function getUserDocRef(userId, successFunction){
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
    console.error("error getting user doc reference "+error);
    successFunction(0, someUserDocRef);
  });
}

function hideAddressBar(){
  if(document.documentElement.scrollHeight<window.outerHeight/window.devicePixelRatio)
    document.documentElement.style.height=(window.outerHeight/window.devicePixelRatio)+'px';
  setTimeout(window.scrollTo(1,1),0);
}
window.addEventListener("load",function(){hideAddressBar();console.log('hidden');});
window.addEventListener("orientationchange",function(){hideAddressBar();});

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

var mbhtm = document.getElementById('mainBody');
var prld = document.getElementById('pre_loader');
