const express = require('express');

const joi = require('joi');

const app = express();

app.use(express.urlencoded({ extended: true })); //to use data submitted from pug to express.

app.set('views', './views');
app.set('view engine', 'pug');

let adminCourses = [];
let studentLogin = [
    { RegNo: 1, Password: 'q' },
    { RegNo: 2, Password: 'test2' },
    { RegNo: 3, Password: 'test3' },
    { RegNo: 4, Password: 'test4' },
    { RegNo: 5, Password: 'test5' },
    { RegNo: 6, Password: 'test6' }
]
let currentRegNo;
let std1 = [],
    std2 = [],
    std3 = [],
    std4 = [],
    std5 = [],
    std6 = [];
let loginFlag = 0;

//MiddleWare Code
app.use((req, res, next) => {
    console.log(req);
    next();
});

//Load first index page.
app.get('/', (req, res) => {
    res.render('index.pug');
});

app.post('/', (req, res) => {
    // Remove RegNo from params after logout of student.
    currentRegNo = "";
    loginFlag = 0;
    res.render('index.pug');
});

//Welcome page for admin and student.
app.get('/admin', (req, res) => {
    res.render('welcome.pug', { person: 'admin' });
});

app.get('/student', (req, res) => {
    //If first time login, show welcome page.
    if (loginFlag === 0) {
        res.render('welcome.pug', { person: 'student' });
        loginFlag = 1;
    } //Else show the dashboard of student.
    else {
        res.render('studAction.pug', { RegNo: currentRegNo });
    }
});

app.post('/student', (req, res) => {
    //Check that id exists and password is correct. Else throw the error.
    console.log(req.body);
    for (let i = 0; i < studentLogin.length; i++) {
        if (Number(req.body.RegNo) === studentLogin[i].RegNo && req.body.Password === studentLogin[i].Password) {
            currentRegNo = req.body.RegNo;
            res.render('studAction.pug', { RegNo: req.body.RegNo });
            return;
        }
    }
    res.status(401).send("Unauthorized username");
    throw new Error("Invalid name");
});

app.get('/student/:RegNo/registerCourse', (req, res) => {
    //Display all the courses from the ViewAllCourses Page. Show the number of students enrolled.  
    console.log(currentRegNo);
    //res.body = {};
    //res.body.Courses = JSON.stringify(adminCourses);
    // res.body.student = JSON.stringify(true);
    res.render('ViewAllCourse.pug', { Courses: adminCourses, student: true });
});

app.post('/student/:RegNo/registerCourse', (req, res) => {
    console.log(req.body);
    //Find the course details.
    //If the details exist in the std array,then pop message that: You have already enrolled in the course.
    const tobeRegisteredCourse = eval('std' + currentRegNo).find(c => 'enroll' + c[0] in req.body);
    console.log(tobeRegisteredCourse);
    if (tobeRegisteredCourse) {
        //res.status(401).render('enrolledCourse.pug');
        res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo), msg: "Course with same Id is already registered." });
    } //Append the course in that std array.
    else {
        for (let i = 0; i < adminCourses.length; i++) {
            let enrollcId = 'enroll' + adminCourses[i].cId;
            if (enrollcId in req.body) {
                eval('std' + currentRegNo).push([adminCourses[i].cId, adminCourses[i].cName, adminCourses[i].cStartDt]);
                adminCourses[i].std += 1;
            }
        }
        res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo) });
    }
});

app.get('/student/:RegNo/unenrollCourse', (req, res) => {
    res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo), unenroll: true });
});

app.post('/student/:RegNo/unenrollCourse', (req, res) => {
    console.log(req.body);
    for (let i = 0; i < eval('std' + currentRegNo).length; i++) {
        let cUnenroll = 'Unenroll' + eval('std' + currentRegNo)[i][0];
        console.log(cUnenroll);
        if (cUnenroll in req.body) {
            //console.log(adminCourses.find(eval('std' + currentRegNo)[i][0]));
            for (let j = 0; j < eval('std' + currentRegNo).length; j++) {
                if (adminCourses[j].cId === eval('std' + currentRegNo)[i][0]) {
                    adminCourses[j].std -= 1;
                    console.log(adminCourses[j]);
                }
            }
            eval('std' + currentRegNo).splice(i, 1);
            res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo) });
        }
    }
});

app.get('/student/:RegNo/enrolledCourse', (req, res) => {
    res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo) });
});

app.get('/admin/addCourse', (req, res) => {
    res.render('addCourse.pug');
});

app.post('/admin/addCourse', (req, res) => {
    console.log(req.body);
    //All fields should be filled.
    const schema = {
        cId: joi.number().required(),
        cName: joi.string().required(),
        cStartDt: joi.date().required()
    }
    const result = joi.validate(req.body, schema, (err, value) => {
        // function getPosition(string, subString, index) {
        //     return string.split(subString, index).join(subString).length;
        // }
        if (err) {
            //const pos = getPosition(err.details[0].message, '\'', 2);
            //res.status(400).send(err.details[0].message.substr(pos, 15));
            res.status(400).send(err.details[0].message);
            return;
        } else {
            //Validate that a course with given id is already present or not.
            //If not throw error and again redirect to that same page.
            const tobeAddedCourse = adminCourses.find(c => c.cId === req.body.cId);
            if (tobeAddedCourse) {
                //res.status(401).send("Course with same Id already exists.");
                res.render('ViewAllCourse.pug', { Courses: adminCourses, msg: "Course with same Id already exists." });
            } //If yes, Add the course to the array with all the properties and redirect to the success page.
            else {
                adminCourses.push({ 'cName': req.body.cName, 'cId': req.body.cId, 'cStartDt': req.body.cStartDt, 'std': 0 });
                console.log(adminCourses);
                res.render('welcome.pug', { cName: req.body.cName });
            }
        }
    });
});

app.get('/admin/ViewAllCourse', (req, res) => {
    res.render('ViewAllCourse.pug', { Courses: adminCourses });
});

app.get('/admin/delCourse', (req, res) => {
    res.render('ViewAllCourse.pug', { Courses: adminCourses, del: true });
});

app.post('/admin/delCourse', (req, res) => {
    //Delete that entry from array.
    console.log(req.body);
    for (let i = 0; i < adminCourses.length; i++) {
        let cDel = 'del' + adminCourses[i].cId;
        console.log(cDel);
        if (cDel in req.body) {
            adminCourses.splice(i, 1);
            console.log(adminCourses);
            res.render('ViewAllCourse.pug', { Courses: adminCourses });
        }
    }
});

console.log("Welcome to my Mini Project");

app.listen(3000);

// app.get('/', (req, res) => {
//     console.log(req.headers.name);
//     s = req.headers.name;
//     res.write(req.headers.name);
//     res.write("sent successful");
//     //res.send("hi"); // In res.send();, we send things through headers, while in res.write() it is normal packet. we need to have res.end() after res.write() to stop the server.
//     res.end(); //This only ends that request, not the server.
// });


//When admin deletes course, all things for each student should be deleted.
//After enrolling course from other user, we are not getting the enrolled course of that user on the enrolledCourse page while it is updated in backend.