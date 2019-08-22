function getUserName() {
  return firebase.auth().currentUser.displayName;
}

function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/app/img/untr192.png';
}

function postPicSelected(event) {
  onMediaFileSelected(event, 'postImages');
}

function onMediaFileSelected(event, coll) {
  event.preventDefault();
  var files = event.target.files;
  for (var i = 0, f; f = files[i]; i++) {
    var file = f;
    console.log('file uploading...');

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
  };
}

var LOADING_IMAGE_URL = 'https://i.ibb.co/9HjHbnY/optimiyed-Gif25fps.gif';
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
        postImages.push(lastPostImage);
        console.log(lastPostImage);
        enablePostButton();
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
    travelMode: false,
    postCount: 0,
  }).then(function(docRef) {
    userDocRef = docRef;
  });

  getUserProfile();
}

function postFct() {
  console.log('post submitted');
  firebase.firestore().collection('ratings').add({
    ratings: ["10"],
    users: [firebase.auth().currentUser.uid],
  }).then(function(docRef) {
    ratingsId = docRef.id;

    console.log('address to coordinates');
    addressToPoint(addressTextInput.value);

    firebase.firestore().collection('posts').add({
      title: titleInput.value,
      uid: firebase.auth().currentUser.uid,
      rating: ratingsId,
      imageUrls: postImages,
      text: postTextInput.value,
      address: addressTextInput.value,
      secrets: secretInput.value,
      locationHash: addressTextInput.value,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch(function(error) {
      console.error("Error adding to collection: ", error);
    });

    userDocRef.update({
      postCount: firebase.firestore.FieldValue.increment(1),
    }).catch(function(error) {
      console.error("Error incrementing post count: ", error);
    });
    console.log("post images have been cleared 1");
    postImages = [];
    ratingsId = "";
  }).catch(function(error) {
    console.error("Error: ", error);
  });
}

function updateTravelMode() {
  userDocRef.update({
    travelMode: modeSelect.checked,
  }).catch(function(error) {
    console.error("Error updating travel mode: ", error);
  });

  console.log('everything needing to be updated should be done here');
  document.getElementById('nearYou').innerText = modeSelect.checked ? 'Locals near you' : 'Travelers near you';
  loadUsers();

  //closeSideNavs();
}

function enableButton() {
  if (lnameInput.value && fnameInput.value && addressInput.value && languageInput.value) {
    submitBtn.removeAttribute('disabled');
  } else {
    submitBtn.setAttribute('disabled', 'true');
  }
}

function enablePostButton() {
  if (postTextInput.value && secretInput.value && addressTextInput.value && titleInput.value && (postImages.length > 0)) {
    postBtn.removeAttribute('disabled');
  } else {
    postBtn.setAttribute('disabled', 'true');
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

function switchTospecificPostScreen() {
  showScreen(6);
}

function switchToChatFct() {
  var query = firebase.firestore().collection('posts').where("uid", "==", firebase.auth().currentUser.uid).limit(1);
  query.get().then(function(querySnapshot) {
    if (!querySnapshot.empty) {
      showScreen(5);
    } else {
      console.log("you have to post before chatting with people");
      alert("you have to post before chatting with people");
    };
  });
}

function clearOldPosts() {
  pagePost.scrollTop = 0;
  while (pagePost.childElementCount > 1) {
    pagePost.removeChild(pagePost.lastChild);
  }
}

var lastQueryItem;
var mayQueryAgain;

function loadNewPost(loadFresh = true) {
  if (loadFresh) {
    lastQueryItem = null;
    mayQueryAgain = true;
  }

  var query = firebase.firestore().collection('posts').orderBy("timestamp", "desc");
  if (!!lastQueryItem)
    query = query.startAfter(lastQueryItem).limit(3);
  else
    query = query.limit(3);

  if (mayQueryAgain) {
    mayQueryAgain = false
    console.log('loading next page...');
    //where("searchTerms", "array-contains", searchBox.value).

    query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          lastQueryItem = doc;
          const div = document.createElement('div');
          div.className = 'row postCon';
          div.innerHTML = createPostHtml(doc.id, doc.get("title"), doc.get("imageUrls")[0], doc.get("text"));
          pagePost.appendChild(div);
          document.getElementById(doc.id).onclick = function() {
            postSelected(this.id);
          };
          document.getElementById(doc.id + "img").onload = function() {
            void div.offsetWidth;
            div.classList.add('visible');
          };
        });
        mayQueryAgain = true;
      })
      .catch(function(error) {
        console.error("Error getting documents: ", error);
        mayQueryAgain = true;
      });
  } else {
    console.log('may not query yet');
  }
}

function openPost(pid) {
  //clear images and fix backbutton
  var backCont = document.getElementById("backCont");
  while (imageGallery.lastChild) {
    imageGallery.removeChild(imageGallery.lastChild);
  }
  imageGallery.appendChild(backCont);

  //clear all text
  var titlsCont = document.getElementById("titlsCont");
  while (secretText.lastChild) {
    secretText.removeChild(secretText.lastChild);
  }
  secretText.appendChild(titlsCont);
  var titltCont = document.getElementById("titltCont");
  while (postText.lastChild) {
    postText.removeChild(postText.lastChild);
  }
  postText.appendChild(titltCont);

  //clear the user thingy
  while (userinfo.lastChild) {
    userinfo.removeChild(userinfo.lastChild);
  }

  var collection = firebase.firestore().collection('posts');
  collection.doc(pid).get().then(function(docRef) {
    var imageUrls = docRef.get("imageUrls");
    imageUrls.forEach(function(imgUrl) {
      imageGallery.appendChild(imageGalleryListHtml(imgUrl));
    });
    //reinitialize the gallery
    var elems = document.querySelectorAll('.slider');
    var instances = M.Slider.init(elems, {
      interval: 8000,
    });
    var title = docRef.get("title");
    postTitle.innerHTML = title;
    var text = docRef.get("text");

    ratingsId = docRef.get("rating");

    const bodytxt = document.createElement('b1');
    bodytxt.innerHTML = text;
    postText.appendChild(bodytxt);

    const secrets = document.createElement('b1');
    secrets.innerHTML = docRef.get("secrets");
    secretText.appendChild(secrets);

    getUserInfo(docRef.get("uid"));
    updateRatingDisplay();
  }).catch(function(error) {
    console.error("Error getting document:", error);
  });
}

function getUserInfo(uid) {
  var query = firebase.firestore().collection('users').where("uid", "==", uid).limit(1);
  query.get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      const div = document.createElement('div');
      div.className = 'userInfo';
      div.innerHTML = userHtml(doc.get("profilePicUrl"), doc.get("firstName"), doc.get("lastName"), doc.get("postCount"));
      userinfo.appendChild(div);
    });
  });
}

function getUserProfile() {
  var query = firebase.firestore().collection('users').where("uid", "==", firebase.auth().currentUser.uid).limit(1);
  query.get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      console.log('profile being constructed');

      const div = document.createElement('div');
      var purl = doc.get("profilePicUrl");
      if (!purl)
        purl = '/app/img/preload.svg';
      div.className = 'row';
      div.addEventListener('click', function() {
        if (confirm("Are you sure, you want to sign out?")) signOut();
      }, false);
      div.innerHTML = userProfileHtml(purl, doc.get("firstName"), doc.get("lastName"), firebase.auth().currentUser.email);
      document.getElementById('userProfile').appendChild(div);
      modeSelect.checked = doc.get('travelMode');
    });
  });
}

function showNavBar(bool, searchBarDisplay) {
  document.getElementById('navBar').style.display = bool ? 'block' : 'none';
  document.getElementById('searchBar').style.display = searchBarDisplay ? 'block' : 'none';
}

function goBack(e) {
  showScreen(e.state.screenIndex, true);
}

function showScreen(s, goingBack = false) {
  if (!goingBack && s != 0)
    history.pushState({
      screenIndex: s,
    }, null, s);

  signinForm.style.display = "none";
  accountForm.style.display = "none";
  postingSpots.style.display = "none";
  searchScreen.style.display = "none";
  chatScreen.style.display = "none";
  specificPostScreen.style.display = "none";
  specificChatScreen.style.display = "none";
  loadingScreen.style.display = "none";
  showNavBar(false, false);

  switch (s) {
    case 0:
      signinForm.style.display = "block";
      break;
    case 1:
      accountForm.style.display = "block";
      break;
    case 2:
      postingSpots.style.display = "block";
      showNavBar(true, false);
      titleInput.value = "";
      secretInput.value = "";
      addressTextInput.value = "";
      postTextInput.value = "";
      postImages = [];
      M.updateTextFields();
      document.getElementById("filePickerForm").reset();
      break;
    case 3:
      searchScreen.style.display = "block";
      showNavBar(true, true);
      clearOldPosts();
      loadNewPost();
      break;
      break;
    case 5:
      showNavBar(true, true);
      chatScreen.style.display = "block";
      document.getElementById('nearYou').innerText = modeSelect.checked ? 'Locals near you' : 'Travelers near you';
      promiseToLoadPrevChat().then(loadUsers());
      break;
    case 6:
      specificPostScreen.style.display = "block";
      break;
    case 7:
      specificChatScreen.style.display = "block";
      loadMessages(currentChatId);
      break;
    case 8:
      loadingScreen.style.display = "block";
      break;
    default:
      showLoadingScreen('error showing screen');
      break;
  }
}

function postSelected(pid) {
  showScreen(6);
  openPost(pid);
}
var ratingsId;

var fnameInput = document.getElementById('first_name_input');
var lnameInput = document.getElementById('last_name_input');
var languageInput = document.getElementById('language_input');
var travelConnectChk = document.getElementById('traveler_connect_input');
var addressInput = document.getElementById('address_input');
var signIn = document.getElementById('sign_in');
var loadingScreen = document.getElementById('loadingDiv');
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
var userinfo = document.getElementById("userinfo");
var specificPostScreen = document.getElementById("specificPostScreen");
var imageGallery = document.getElementById("imageGallery");
var postText = document.getElementById("postText");
var secretText = document.getElementById("secretText");
var postTitle = document.getElementById("postTitle");
var addressTextInput = document.getElementById("addressTextInput");
var ratingSlider = document.getElementById("ratingSlider");
var searchBox = document.getElementById("search_box");
var modeSelect = document.getElementById("modeSelect");

//postingSpots
var postImages = {};

var postPicUpload = document.getElementById("upload_post_pic");
postPicUpload.onchange = function() {
  console.log('insert the current image name into a header element here');
};

pagePost.addEventListener('scroll', function() {
  if (pagePost.scrollTop + pagePost.clientHeight >= pagePost.scrollHeight) {
    loadNewPost(false);
  }
});

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

postTextInput.addEventListener('keyup', enablePostButton);
postTextInput.addEventListener('change', enablePostButton);
secretInput.addEventListener('keyup', enablePostButton);
secretInput.addEventListener('change', enablePostButton);
addressTextInput.addEventListener('keyup', enablePostButton);
addressTextInput.addEventListener('change', enablePostButton);
titleInput.addEventListener('keyup', enablePostButton);
titleInput.addEventListener('change', enablePostButton);

// Remove the warning about timstamps change.
var firestore = firebase.firestore();
showScreen(0);

function userHtml(imgUrl, fn, ln, postc) {
  return `
  <div class="bottom-padding-1">
    <b2>This post was written by:</b2>
  </div>
  <div class="col s12 m8 offset-m2 l6 offset-l3">
    <div class="row valign-wrapper">
      <div class="col s3">
        <img src=${imgUrl} class="circle responsive-img">
      </div>
      <div class="col s9">
        <b1>
          ${fn} ${ln}
        </b1><br>
        <b1>
          number of posts ${postc}
        </b1>
      </div>
    </div>
  </div>`;
}

function userProfileHtml(imgUrl, fn, ln, email) {
  return `
    <div class="col s12" style="position: relative; right: -0.300rem; top: 1rem">
      <div class="valign-wrapper">
        <div class="col s3">
          <img src=${imgUrl} class="circle responsive-img">
        </div>
        <div class="col s9" style="position: relative; top: -0.375rem">
          <h2 class="white-text">${fn} ${ln}</h2>
          <b1 class="white-text style="position: relative; top: -0.25rem">${email}</b1>
        </div>
      </div>
    </div>`;
}

function imageGalleryListHtml(imgUrl) {
  const lelem = document.createElement('li');
  lelem.innerHTML = '<img src=' + imgUrl + '>';
  return lelem;
}

function createPostHtml(postId, titl, testImg, txt) {
  return `
      <div class="col s12">
        <div id="${postId}" class="card waves-effect waves-block waves-light">
          <div class="card-image">
            <img id="${postId}img" src=${testImg}>
          </div>
          <div class="card-stacked">
            <div class="card-content">
              <h1>${titl}</h1>
              <b1>${txt}</b1>
            </div>
          </div>
        </div>
      </div>
      `;
}

function closeSideNavs() {
  sideNavInstances.forEach(function(sideNavInstance) {
    sideNavInstance.close();
  });
}

var sideNavInstances;

document.addEventListener('DOMContentLoaded', function() {
  M.AutoInit();
  var elems = document.querySelectorAll('.slider');
  var instances = M.Slider.init(elems, {
    interval: 8000,
  });
  elems = document.querySelectorAll('.sidenav');
  sideNavInstances = M.Sidenav.init(elems, {
    inDuration: 350,
    outDuration: 350,
    edge: 'left'
  });

  document.addEventListener('fullscreenchange', updateFsBtn);
  document.addEventListener('mozfullscreenchange', updateFsBtn);
  document.addEventListener('MSFullscreenChange', updateFsBtn);
  document.addEventListener('webkitfullscreenchange', updateFsBtn);
});

ratingSlider.addEventListener('change', ratingReadWrite);
ratingSlider.addEventListener('keyup', ratingReadWrite);
ratingSlider.addEventListener('input', ratingReadWrite);

window.addEventListener("popstate", goBack);

var prevRating = 0;

function ratingReadWrite() {
  if (ratingSlider.value != prevRating) {
    prevRating = ratingSlider.value;
    docRef = firebase.firestore().collection('ratings').doc(ratingsId);
    docRef.get().then(function(docSnap) {
      usersArray = docSnap.get("users");
      ratingsArray = docSnap.get("ratings");

      if (!usersArray.includes(firebase.auth().currentUser.uid)) {
        console.log("adding user and rating");
        ratingsArray.push(ratingSlider.value);
        usersArray.push(firebase.auth().currentUser.uid);
        docRef.update({
          ratings: ratingsArray,
          users: usersArray,
        }).catch(function(error) {
          console.error('There was an error adding the current users rating', error);
        });
      } else {
        ratingsArray[usersArray.indexOf(firebase.auth().currentUser.uid)] = ratingSlider.value;
        docRef.update({
          ratings: ratingsArray,
        }).catch(function(error) {
          console.error('There was an error updating the current users rating', error);
        });
      }
      updateRatingDisplay();
    });
  }
}

function updateRatingDisplay() {
  firebase.firestore().collection('ratings').doc(ratingsId).get().then(function(docRef) {
    var rtgs = docRef.get("ratings");
    var ratingsCount = rtgs.length;
    var total = 0;
    while (rtgs.length > 0) {
      total += parseInt(rtgs.pop());
    }
    ratingLabel.innerText = ('Rating: ' + (total / ratingsCount));
  }).catch(function(error) {
    console.error('error during average rating function', error);
    ratingLabel.innerText = "error getting rating";
  });
}
