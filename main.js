const express = require('express');

const joi = require('joi');

const app = express();

app.use(express.urlencoded({ extended: true })); //to use data submitted from pug to express.

app.set('views', './views');
app.set('view engine', 'pug');

let adminCourses = [];
let studentLogin = [
    { RegNo: 1, Password: 'test1' },
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

//MiddleWare Code to update the status of course.
app.use((req, res, next) => {
    console.log(req);
    adminCourses.forEach(c => {
        if (c.std >= 5) c.admStatus = "Active";
        else c.admStatus = "Inactive";
    });
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

//Redirect any request coming to this URL to /student.
app.get('/student/:RegNo/', (req, res) => {
    res.redirect('/student');
});

app.get('/student/:RegNo/registerCourse', (req, res) => {
    //Display all the courses from the ViewAllCourses Page. 
    //Show the status of course.  
    adminCourses.forEach(element => {
        if (Date.now() < Date.parse(element.cStartDt)) {
            element.stdStatus = "active";
        } else {
            element.stdStatus = "Inactive";
        }
    });
    res.render('ViewAllCourse.pug', { Courses: adminCourses, student: true });
});

app.post('/student/:RegNo/registerCourse', (req, res) => {
    //Find the course details.
    //If the details exist in the std array,then don't enroll it and throw error.
    let flag = 0;
    const tobeRegisteredCourse = eval('std' + currentRegNo).find(c => 'enroll' + c[0] in req.body);
    console.log(tobeRegisteredCourse);
    if (tobeRegisteredCourse) {
        res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo), msg: "Course with same Id is already registered." });
    } //Append the course in that std array.
    else {
        for (let i = 0; i < adminCourses.length; i++) {
            let enrollcId = 'enroll' + adminCourses[i].cId;
            if (enrollcId in req.body) {
                //If status inactive of Course for std, than don't enroll.
                if (adminCourses[i].stdStatus === "Inactive") {
                    res.status(401).send("Courses you selected are Inactive.");
                    flag = 1;
                    return;
                } else {
                    eval('std' + currentRegNo).push([adminCourses[i].cId, adminCourses[i].cName, adminCourses[i].cStartDt]);
                    adminCourses[i].std += 1;
                }
            }
        }
        res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo) });
    }
});

app.get('/student/:RegNo/unenrollCourse', (req, res) => {
    res.render('enrolledCourse.pug', { Courses: eval('std' + currentRegNo), unenroll: true });
});

app.post('/student/:RegNo/unenrollCourse', (req, res) => {
    //Delete the course from std array and reduce the overall count in adminCourses array.
    for (let i = 0; i < eval('std' + currentRegNo).length; i++) {
        let cUnenroll = 'Unenroll' + eval('std' + currentRegNo)[i][0];
        if (cUnenroll in req.body) {
            for (let j = 0; j < eval('std' + currentRegNo).length; j++) {
                if (adminCourses[j].cId === eval('std' + currentRegNo)[i][0]) {
                    adminCourses[j].std -= 1;
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
    //All fields should be filled.
    const schema = {
        cId: joi.number().required(),
        cName: joi.string().required(),
        cStartDt: joi.date().required()
    }
    const result = joi.validate(req.body, schema, (err, value) => {
        if (err) {
            res.status(400).send(err.details[0].message);
            return;
        } else {
            //Validate that a course with given id is already present or not.
            //If not throw error and again redirect to that same page.
            //If yes, Add the course to the array with all the properties and redirect to the success page.
            const tobeAddedCourse = adminCourses.find(c => c.cId === req.body.cId);
            if (tobeAddedCourse) {
                res.render('ViewAllCourse.pug', { Courses: adminCourses, msg: "Course with same Id already exists." });
            } else {
                adminCourses.push({ 'cName': req.body.cName, 'cId': req.body.cId, 'cStartDt': req.body.cStartDt, 'std': 0 });
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
    //Delete that entry from array of admin as well as each std who has enrolled that course.
    for (let i = 0; i < adminCourses.length; i++) {
        let cDel = 'del' + adminCourses[i].cId;
        if (cDel in req.body) {
            for (let j = 1; j < 6; j++) {
                for (let k = 0; k < eval('std' + j).length; k++) {
                    if (adminCourses[i].cId === eval('std' + j)[k][0]) {
                        eval('std' + j).splice(k, 1);
                    }
                }
            }
            adminCourses.splice(i, 1);
        }
    }
    res.render('ViewAllCourse.pug', { Courses: adminCourses });
});

console.log("Welcome to my Mini Project");

app.listen(3000);