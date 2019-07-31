// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
var userDocRef;
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      console.log('signin success');
      var query = firebase.firestore().collection('users').where("uid", "==", firebase.auth().currentUser.uid).limit(1);
      var userDocId;
      query.get().then(function(querySnapshot) {
          if (!querySnapshot.empty) {
            showScreen(2);
            console.log('welcome back');
            querySnapshot.forEach(function(documentSnapshot) {
              userDocId = documentSnapshot.id;
              userDocRef = firebase.firestore().collection('users').doc(userDocId);
              userDocRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                profilePicUrl: getProfilePicUrl(),
              });
            });
            getUserProfile();
            return false;
          } else {
            showScreen(1);
            console.log('user signing in for the first time');
            return false;
          }
        })
        .catch(function(error) {
          console.log("Error getting document id:", error);
          showScreen(1);
          return false;
        });

    },
    uiShown: function() {
      mbhtm.style.display = "block";
      prld.style.display = "none";
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
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

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

var mbhtm = document.getElementById('mainBody');
var prld = document.getElementById('pre_loader');
