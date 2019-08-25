console.log('initialize app being executed, auto login detected');

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function() {
  console.log('it worked?');
}).catch(function(error) {
  console.error(error);
});

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
