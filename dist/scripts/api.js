// Form elem
const adminForm = document.querySelector('.admin-actions');
const createForm = document.querySelector('#create-form');
const signupForm = document.querySelector('#signup-form');
const attdBtn = document.querySelector('.attd-button');

// elem
const logout = document.querySelectorAll('#logout');
const sidenavElem = document.querySelector('.sidenav');
const btnAttend = document.getElementById("attend-btn");

let userData = [];
moment.locale('id');
const currentDate = moment();
let daysInMonth = currentDate.daysInMonth();
const days = moment.weekdays();
const months = moment.months();

// add admin cloud functions
adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const adminEmail = document.querySelector('#admin-email').value;
    const addAdminRole = functions.httpsCallable('addAdminRole');
    addAdminRole({ email: adminEmail }).then(result => {
        console.log(result);
    });
});

// listen auth status changes
auth.onAuthStateChanged(user => {
    const pages = document.querySelectorAll('.page');
    if (user) {
        user.getIdTokenResult().then(idTokenResult => {
            user.admin = idTokenResult.claims.admin;
            db.collection('Users').doc(user.uid).get().then(doc => {
                if(doc.exists){
                    setupUI(user);
                    getSummary(user).catch(err => console.log(err));
                } else {
                    const instance = document.getElementById('modal-signup');
                    M.Modal.getInstance(instance).open();
                    signupForm['uid'].value = user.uid;
                    signupForm['email'].value = user.email;
                }
            }).catch(err => {
                console.log(err.message)
            });

            // check
            check(user).then(querySnapshot => {
                if (querySnapshot.size === 0) {
                    buttonChange(false);
                } else {
                    buttonChange(true);
                }
            });
        });
        // get data
        const ref = db.collection('Presensi').doc(user.uid);
        ref.collection('logPresensi').orderBy("checkIn", "desc").onSnapshot(snapshot => {
            setupDashboard(snapshot.docs);
        }, err => {
            console.log(err.message);
        });
    } else {
        pages.forEach(page => {
           if(page.id === 'home'){
               page.classList.add('active');
           } else {
               page.classList.remove('active');
           }
        });
        userData = [];
        setupUI();
        setupDashboard([]);
    }
});

const getSummary = async (user) => {
    userData = [];
    const attRef = db.collection('Presensi');
    const userRef = db.collection('Users');
    if (user.admin) {
        onPreload(summary);
        let result = await userRef.get();
        for (const users of result.docs) {
            let u = users.data();
            let data = await attRef.doc(users.id).collection('logPresensi').orderBy("checkIn", "asc").get();
            userData.push({
                nik: u.nik,
                name: u.name,
                email: u.email,
                data: data.docs
            });
        }
        setupSummary(user);
    } else {
        onPreload(summary);
        let users = await userRef.doc(user.uid).get();
        let u = users.data();
        let data = await attRef.doc(user.uid).collection('logPresensi').orderBy("checkIn", "asc").get();
        userData.push({
            nik: u.nik,
            name: u.name,
            email: u.email,
            data: data.docs
        });
        setupSummary(user);
    }
}

// attendance
const attend = async () => {
    const user = firebase.auth().currentUser;
    const attdRef = db.collection('Presensi').doc(user.uid);

    let doc = await db.collection('Users').doc(user.uid).get();
    let data = doc.data();
    await db.collection('Presensi').doc(user.uid).set({
        name: data.name,
        nik: data.nik,
        email: user.email
    });
    let querySnapshot = await check(user);
    if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
            attdRef.collection('logPresensi').doc(doc.id).update({
                check: true,
                checkOut: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        buttonChange(false);
    } else {
        attdRef.collection('logPresensi').add({
            check: false,
            checkIn: firebase.firestore.FieldValue.serverTimestamp(),
        });
        buttonChange(true);
    }

    // db.collection('Users').doc(user.uid).get().then(doc => {
    //     data = doc.data();
    //     attdRef = db.collection('Presensi').doc(user.uid);
    //     attdRef.set({
    //         name: data.name,
    //         nik: data.nik,
    //         email: user.email
    //     }).then(() => {
    //         check(user).then(querySnapshot => {
    //             if (querySnapshot.size > 0) {
    //                 querySnapshot.forEach(doc => {
    //                     attdRef.collection('logPresensi').doc(doc.id).update({
    //                         check: true,
    //                         checkOut: firebase.firestore.FieldValue.serverTimestamp()
    //                     });
    //                 });
    //                 buttonChange(false);
    //             } else {
    //                 attdRef.collection('logPresensi').add({
    //                     check: false,
    //                     checkIn: firebase.firestore.FieldValue.serverTimestamp(),
    //                 });
    //                 buttonChange(true);
    //             }
    //         });
    //     });
    // });
};

// check attendance
async function check(user) {
    const attdRef = db.collection('Presensi').doc(user.uid);
    return await attdRef.collection('logPresensi').where("check", "==", false).get();
}

// signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let uid = signupForm["uid"].value;
    let nik = parseInt(signupForm['signup-nik'].value);
    let name = signupForm['signup-name'].value;
    let email = signupForm['email'].value;

    db.collection('Users').doc(uid).set({
        nik: nik,
        name: name,
        email: email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        closeSidenav();
        signupForm.reset();
        signupForm.querySelector('.error').innerHTML = '';
        location.reload()
    }).catch(err => {
        signupForm.querySelector('.error').innerHTML = err.message;
    });
});

// logout
logout.forEach(logout => {
    logout.addEventListener('click', (e) => {
        e.preventDefault();
        closeSidenav();
        const instance = document.getElementById('modal-signup');
        M.Modal.getInstance(instance).close();
        auth.signOut();
    })
});

// login
const doLogin = () => {
    // preventDefault();
    let loginForm = document.querySelector('#login-form');
    let elem = loginForm.querySelector('#login-preloader');
    onPreload(elem);

    // get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    auth.signInWithEmailAndPassword(email, password).then(cred => {

    }).catch(err => {
        alert(err.message);
        afterPreload(elem);
    });
};

function prevMonth() {
    currentDate.subtract(1, 'month');
    daysInMonth = currentDate.daysInMonth();
}
function nextMonth() {
    currentDate.add(1, 'month');
    daysInMonth = currentDate.daysInMonth();
}

