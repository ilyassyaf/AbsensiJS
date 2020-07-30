const historiesList = document.querySelector('.histories');
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const accountDetails = document.querySelector('.account-details');
const adminItems = document.querySelectorAll('.admin');
const attendance = document.querySelector('.attendance');
const loginPanel = document.querySelector('.login-panel');
const summary = document.getElementById('summary');
const clock = document.getElementById("clock");
const date = document.getElementById("date");

const setupUI = (user) => {
    accountDetails.innerHTML = /*html*/`
        <div class="progress">
            <div class="indeterminate"></div>
        </div>
    `;
    if (user) {
        if (user.admin) {
            adminItems.forEach(item => item.style.display = 'block');
        }
        // account details
        db.collection('Users').doc(user.uid).get().then(doc => {
            const html = /*html*/`
                <h4>Account details</h4>
                <table>
                    <tbody>
                        <tr>
                            <th class="center" colspan="2">Logged in as <span class="pink-text">${user.email}</span></th>
                        </tr>
                        <tr>
                            <th>Username</th>
                            <td>${doc.data().name}</td>
                        </tr>
                        <tr>
                            <th>NIK</th>
                            <td>${doc.data().nik}</td>
                           </tr>
                        <tr>
                            <th class="pink-text center" colspan="2">${user.admin ? 'Admin' : 'Pegawai'}</th>
                        </tr>
                    </tbody>
                </table>
            `;
            accountDetails.innerHTML = html;
        });

        // toggle UI Element
        loggedInLinks.forEach(item => item.style.display = 'block');
        attendance.style.display = 'block';
        loggedOutLinks.forEach(item => item.style.display = 'none');
    } else {
        // hide account info
        accountDetails.innerHTML = /*html*/`
            <i style="font-size: 128px" class="flow-text red-text material-icons">warning</i>
            <h3 class="flow-text">Please Log-in!</h3>
        `;
        summary.innerHTML = /*html*/`
            <i style="font-size: 128px" class="flow-text red-text material-icons">warning</i>
            <h3 class="flow-text">Please Log-in!</h3>
        `;
        // toggle UI Element
        adminItems.forEach(item => item.style.display = 'none');
        attendance.style.display = 'none';
        loggedInLinks.forEach(item => item.style.display = 'none');
        loggedOutLinks.forEach(item => item.style.display = 'block');
    }
};

// setuo summary
const setupSummary = (user) => {
    summary.innerHTML = ``;

    // top bar
    let topBar = document.createElement('div');

    // refresh btn
    let btn = document.createElement('button');
    btn.onclick = () => { getSummary(user); };
    btn.classList.add('btn-floating', 'waves-effect', 'green', 'right');
    let icon = document.createElement('i');
    icon.classList.add('material-icons');
    icon.textContent = 'refresh';
    btn.appendChild(icon);
    topBar.appendChild(btn);

    // prev month
    let btnPrev = document.createElement('button');
    btnPrev.classList.add('btn', 'waves-effect', 'white', 'black-text');
    btnPrev.onclick = () => { prevMonth(); setupSummary(user); };
    let prevIcon = document.createElement('i');
    prevIcon.classList.add('material-icons');
    prevIcon.textContent = 'navigate_before';
    btnPrev.appendChild(prevIcon);
    topBar.appendChild(btnPrev);

    // date picker
    let currMonth = currentDate.month();
    let currYear = currentDate.year();
    let monthPicker = document.createElement('input');
    monthPicker.type = 'month';
    // monthPicker.width = 10;
    monthPicker.value = `${currYear}-${(currMonth +1) < 10 ? '0' + (currMonth +1) : (currMonth +1)}`;
    monthPicker.onchange = () => {
        let val = monthPicker.value;
        let date = val.split('-');
        setDate(date[0], date[1]-1);
        setupSummary(user);
    };
    function setDate(year, month) {
        currentDate.set({'year' : year, 'month' : month});
        daysInMonth = currentDate.daysInMonth();
    }
    topBar.appendChild(monthPicker);

    // next month
    let btnNext = document.createElement('button');
    btnNext.classList.add('btn', 'waves-effect', 'white', 'black-text');
    btnNext.onclick = () => { nextMonth(); setupSummary(user); };
    let nextIcon = document.createElement('i');
    nextIcon.classList.add('material-icons');
    nextIcon.textContent = 'navigate_next';
    btnNext.appendChild(nextIcon);
    topBar.appendChild(btnNext);

    // append top bar
    summary.appendChild(topBar);

    function timeConvert(num) {
        function formatNumber(numb) {
            return (numb < 10 ? `0${numb}` : numb);
        }
        if (num < 0) {
            let hours = Math.floor(Math.abs(num) / 60);
            let minutes = Math.abs(num) % 60;
            return "-" + formatNumber(hours) + ":" + formatNumber(minutes);
        } else {
            let hours = Math.floor(num / 60);
            let minutes = num % 60;
            return "+" + formatNumber(hours) + ":" + formatNumber(minutes);
        }
    }

    if (user.admin) {
        // data
        const headerContent = [
            {content: 'NIK', rowspan:2, colspan:1},
            {content: 'Nama', rowspan:2, colspan:1},
            {content: 'Bulan '+months[currentDate.month()]+' '+currYear, rowspan:1, colspan:daysInMonth}
        ];

        //create table
        const table = document.createElement("table");
        table.id = 'summaryTable';
        table.classList.add('hover', 'stripe', 'order-column', 'row-border');
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // header
        const row1 = tr.cloneNode(false);
        headerContent.forEach((data) => {
            let th = row1.insertCell();
            th.textContent = data.content;
            th.colSpan = data.colspan;
            th.rowSpan = data.rowspan;
            th.classList.add('centerText');
        });
        const row2 = tr.cloneNode(false);
        for(let i = 1; i <= daysInMonth; i++){
            let th = row2.insertCell();
            th.textContent = i;
            th.classList.add('centerText');
        }
        thead.appendChild(row1);
        thead.appendChild(row2);
        table.appendChild(thead);

        // content
        userData.forEach((data) => {
            const attd = [];
            data.data.forEach((date) => {
                let d = date.data();
                let att = moment(d.checkIn.toMillis());
                attd.unshift(att);
            });
            // console.log(attd);
            // throw new Error('died');
            const row = tr.cloneNode(false);
            let td0 = row.insertCell(0); td0.textContent = data.nik;
            let td1 = row.insertCell(1); td1.textContent = data.name;
            td1.classList.add('nowrap');
            for(let i = 1; i <= daysInMonth; i++){
                const current = moment(`${currentDate.year()}-${currentDate.month()+1}-${i}`, 'YYYY-MM-DD');
                // console.log(current.day());
                let td = row.insertCell(i+1);
                td.classList.add('date', 'center-align');
                if (current.day() === 0 || current.day() === 6){
                    td.classList.add('red', 'lighten-4');
                }
                for(data of attd){
                    let date = data.date();
                    let month = data.month();
                    let year = data.year();
                    if(date === i && month === currentDate.month() && year === currentDate.year()){
                        // td.classList.add('green');
                        td.innerText = "P";
                    }
                }
            }
            tbody.appendChild(row);
            table.appendChild(tbody);
        });

        // append table
        summary.appendChild(table);

        // datatables
        $('#summaryTable').DataTable( {
            "scrollX": true,
            fixedColumns: {
                leftColumns: 2
            },
            dom: 'Bfrtlip',
            buttons: [
                { extend: 'excelHtml5',
                    title: `Laporan Kehadiran Pegawai Inputer Bulan ${currentDate.format('MMMM YYYY')}`,
                    messageBottom: `
                    Semarang, ${moment().format('DD MMMM YYYY')}
                    Manager Customer Care
                    
                    
                    
                    Soeprihat Anwar
                    NIK.640511
                    `,
                },
                { extend: 'pdfHtml5',
                    title: `Laporan Kehadiran Pegawai Inputer Bulan ${currentDate.format('MMMM YYYY')}`,
                    messageBottom: `
                    Semarang, ${moment().format('DD MMMM YYYY')}
                    Manager Customer Care
                    
                    
                    
                    Soeprihat Anwar
                    NIK.640511
                    `,
                    orientation: 'landscape',
                },
                'csvHtml5',
            ],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search..."
            }
        } );
    } else {
        const tableHeader = ["Tanggal", "Hari", "Masuk (08.00)", "Keluar (17.00)"];
        const div = document.createElement('div');
        div.classList.add('container');
        div.innerHTML = /*html*/`
            <table>
                <tr>
                    <th>NIK</th>
                    <td>:</td>
                    <td>${userData[0].nik}</td>
                </tr>
                <tr>
                    <th>Nama</th>
                    <td>:</td>
                    <td>${userData[0].name}</td>
                </tr>
                <tr>
                    <th>Bulan</th>
                    <td>:</td>
                    <td>${months[currentDate.month()]} ${currentDate.year()}</td>
                </tr>
            </table>
        `;

        const table = document.createElement('table');
        table.id = 'logTable';
        table.classList.add('hover', 'stripe', 'row-border');
        const footer = document.createElement('tfoot');

        let thead = table.createTHead();
        let row = thead.insertRow(0);
        for (let header of tableHeader) {
            let th = document.createElement('th');
            th.textContent = header;
            row.appendChild(th);
        }
        let rows = 0;
        let tbody = table.createTBody();
        for (let data of userData[0].data) {
            let d = data.data();
            let checkIn = moment(d.checkIn.toMillis());
            let inThreshold = moment(d.checkIn.toMillis()).set({ 'hour': 8, 'minute': 0 });
            let inDiff = moment.duration(checkIn.diff(inThreshold)).asMinutes();
            let checkOut = (d.checkOut ? moment(d.checkOut.toMillis()) : 0);
            let outThreshold = (d.checkOut ? moment(d.checkOut.toMillis()).set({ 'hour': 17, 'minute': 0 }) : 0);
            let outDiff = (d.checkOut ? moment.duration(checkOut.diff(outThreshold)).asMinutes() : 0);
            if (checkIn.isSame(currentDate, 'month') && checkIn.isSame(currentDate, 'year')) {
                let row = tbody.insertRow(rows);
                row.insertCell(0).textContent = checkIn.format('LL');
                row.insertCell(1).textContent = checkIn.format('dddd');
                row.insertCell(2)
                    .innerHTML = `<span class='${(inDiff <= 0 ? 'green-text' : 'red-text')}'>${checkIn.format('LT')}</span>`;
                row.insertCell(3)
                    .innerHTML = `<span class='${(outDiff >= 0 ? 'green-text' : 'red-text')}'>${(d.checkOut ? checkOut.format('LT') : 0)}</span>`;
                rows++;
            }
        }
        footer.innerHTML = `
            <tr>
                <td colspan="2">Total</td>
                <td>:</td>
                <td>${rows} Hari</td>
            </tr>
        `;

        summary.appendChild(div);
        table.appendChild(footer);
        summary.appendChild(table);

        // datatables
        $('#logTable').DataTable( {
            dom: 'rt',
            "ordering": false,
            "paging": false
        } );
    }
};

// setup Histories
const setupDashboard = (data) => {
    if (auth.currentUser === null) {
        historiesList.innerHTML = ``;
        loginPanel.innerHTML = `
            <h4>Login</h4><br />
            <form onsubmit="doLogin();return false" id="login-form" style="margin: auto;max-width: 550px">
                <div class="input-field">
                    <input type="email" id="login-email" required />
                    <label for="login-email">Email address</label>
                </div>
                <div class="input-field">
                    <input type="password" id="login-password" required />
                    <label for="login-password">Your password</label>
                </div>
                <button class="btn red darken-2 z-depth-0">Login</button>
                <div id="login-preloader"></div>
            </form>
            <div class="container" align="center">
                <table style="max-width: fit-content">
                    <tr>
                        <td rowspan="2"><img style="width: 140px; height: 140px" class="responsive-img" src="./img/logo.png"></td>
                        <td><h2 class="flow-text">Telkom Indonesia</h2></td>
                    </tr>
                    <tr>
                        <td><h4 class="flow-text">The world in your hand</h4></td>
                    </tr>
                </table>
            </div>
        `;
    } else {
        if (data.length) {
            let html = ``;

            data.forEach(doc => {
                const history = doc.data();
                const status = history.check;
                const date = history.checkIn;
                const checkIn = history.checkIn;
                const checkOut = history.checkOut;
                const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};


                const li = `
                <li>
                    <div class="collapsible-header 
                    ${!status ? 'red' : 'green'} lighten-3">
                    ${date ? date.toDate().toLocaleDateString('id-ID', options) : ''}</div >
                    <div class="collapsible-body white">
                        <table>
                            <tbody>
                                <tr>
                                    <td>Absen masuk</td>
                                    <td>:</td>
                                    <td>${checkIn ? checkIn.toDate().toTimeString() : ''}</td>
                                </tr>
                                <tr>
                                    <td>Absen keluar</td>
                                    <td>:</td>
                                    <td>${checkOut ? checkOut.toDate().toTimeString() : ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </li>
            `;
                html += li;
            });
            historiesList.innerHTML = html;
            loginPanel.innerHTML = ``;
        } else {
            loginPanel.innerHTML = `
                <div class="center-align">
                    <h5><i>No Data</i></h5>
                </div>
            `;
        }
    }
};

const onPreload = (elem) => {
    elem.innerHTML = /*html*/`
        <div class="progress">
            <div class="indeterminate"></div>
        </div>  
    `;
};

const afterPreload = (elem) => {
    elem.innerHTML = '';
};

const buttonChange = (user) => {
    let html = '';
    let button = '';

    if (user) {
        button = /*html*/`
            <button onclick = "attend()" class="btn red darken-2 waves-effect waves-light attd-button" >Keluar</button>
        `;
        html += button;
    } else {
        button = /*html*/`
            <button onclick = "attend()" class="btn green darken-2 waves-effect waves-light attd-button" >Masuk</button>
            `;
        html += button;
    }
    attendance.innerHTML = html;
}

// Timer
setInterval(() => {
    myTimer();
}, 500);
function myTimer() {
    let t = new Date();
    t = t.toLocaleTimeString();
    let d = moment();
    d = d.format("dddd, DD MMMM YYYY");
    clock.innerHTML = t;
    date.innerHTML = d;
}

// setup materialize components
document.addEventListener('DOMContentLoaded', function () {
    const options = {
        'dismissible' : false
    };
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals, options);

    const items = document.querySelectorAll('.collapsible');
    M.Collapsible.init(items);

    const sidenav = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenav);
});

// functions
const closeSidenav = () => {
    M.Sidenav.getInstance(sidenavElem).close();
};