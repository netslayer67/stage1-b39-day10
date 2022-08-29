// const { json } = require('express')
const express = require('express')
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')

const data_base = require('./connection/dataBase')
const upload = require('./middleware/fileUploads')

const app = express()
const port = 5000

app.set('view engine', 'hbs') // set view engine hbs
app.use('/assets', express.static(__dirname + '/assets')) // path folder untuk assets
app.use('/uploads', express.static(__dirname + '/uploads')) // path folder untuk uploads
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: 'nt kadang-kadang',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000 //Batasan 2 jam expied
    }
}))

const techstacks = {
    'node-js': 'NodeJS',
    'python': 'Python',
    'react': 'ReactJS',
    'java': 'Java',
}

data_base.connect(function (err, client, done) {
    if (err) throw err // menampilkan error koneksi ke database



    app.get('/', function (request, response) {
        console.log(request.session);

        const query = `SELECT tb_projects.id, tb_projects.name, description, tb_projects.technologies ,tb_projects.start_date, tb_projects.end_date ,image, tb_projects.user_id, tb_user.name as user, date FROM tb_projects LEFT JOIN tb_user ON tb_projects.user_id = tb_user.id ORDER BY id DESC`

        client.query(query, function (err, result) {
            if (err) throw err // menampilkan error query

            // console.log(result.rows);
            let data = result.rows
            let data_project = data.map(function (item) {
                return {
                    //(item) menampung data dari dataProject
                    ...item,
                    date: getFullTime(item.durasi),
                    durasi: getDistanceTime(item.start_date, item.end_date),
                    isLogin: request.session.isLogin
                }
            })
            // console.log(data_project);
            let filterBlog
            if (request.session.user) {
                filterBlog = data_project.filter(function (item) {
                    return item.user_id === request.session.user.id
                })
                console.log(filterBlog);
            }
            let resultProject = request.session.user ? filterBlog : data_project


            response.render("index", { dataProject: resultProject, user: request.session.user, isLogin: request.session.isLogin })
        })
    })

    app.get('/add-project', function (request, response) {
        if (!request.session.user) {
            request.flash('danger', 'Anda belum login')
            return response.redirect('/login')
        }

        let dataRows = {
            technologies: Object.keys(techstacks).map(stack => ({
                name: techstacks[stack],
                value: stack,
                checked: false
            }))
        }

        request.session.isLogin,
            response.render("addProject", { user: request.session.user, isLogin: request.session.isLogin, data: dataRows })
    })

    app.post('/add-project', upload.single('inputImages'), function (request, response) {

        let { inputProjectName: name, startDate: start_date, endDate: end_date, inputDesc: description, inputTech = '',  } = request.body


        let technologies = `{${Array.isArray(inputTech) ? inputTech.join(', ') : inputTech}}`

        const image = request.file.filename

        let userId = request.session.user.id

        let query = `INSERT INTO tb_projects(name, start_date, end_date, description, image, technologies, user_id)
            VALUES ('${name}', '${start_date}', '${end_date}', '${description}', '${image}','${technologies}',${userId});`

        client.query(query, function (err, result) {
            if (err) throw err

            response.redirect('/')
        })


    })


    app.get('/contact', function (request, response) {
        response.render("contact")
    })

    app.get("/project-detail/:index", function (request, response) {
        let id = request.params.index;

        let query = `SELECT * FROM tb_projects WHERE id=${id};`

        client.query(query, function (err, result) {
            if (err) throw err;

            console.log(result.rows[0]);

            let data = result.rows;
            let data_Project = data.map(function (item) {
                return {
                    ...item,
                    durasi: getDistanceTime(item.start_date, item.end_date),
                    start_date: getFullTime(item.start_date),
                    end_date: getFullTime(item.end_date),
                    image: item.image
                };
            });

            response.render("project-detail", { data: data_Project[0] });
        });

    });

    app.get('/delete-project/:index', function (request, response) {
        let id = request.params.index
        let query = `DELETE FROM tb_projects WHERE id=${id}`

        client.query(query, function (err, result) {
            if (err) throw err

            response.redirect('/')

        })


    })

    app.get('/edit-project/:index', function (request, response) {

        if (!request.session.user) {
            request.flash('danger', 'Anda belum login')
            return response.redirect('/login')
        }

        let id = request.params.index
        let date = new Date().toISOString().split('T')[0]
        let query = `SELECT * FROM tb_projects WHERE id=${id}`

        client.query(query, function (err, result) {
            if (err) throw err

            let data = result.rows;
            let dataRows = {
                name: data[0].name,
                description: data[0].description,
                start_date: getStart(data[0].start_date),
                end_date: getEnd(data[0].end_date),
                // technologies: data[0].technologies.map(tech => ({
                //     name: techstacks[tech],
                //     value: tech,
                //     checked: tech !== undefined,
                // })),
                technologies: Object.keys(techstacks).map(stack => ({
                    name: techstacks[stack],
                    value: stack,
                    checked: data[0].technologies.indexOf(stack) != -1
                }))
            }



            // let technologies = `SELECT technologies FROM tb_projects`
            // if (technologies[1] !== undefined) {
            //     i
            // }



            // do{
            //     inputNode.checked
            // } 
            // while tb_pro !== undefined



            // let bebas = data[0].technologies

            // if (bebas[0] =)

            response.render("updateProject", { data: dataRows, id });



            // response.render("updateProject", { data: data[0] })
        })

    })

    app.post('/edit-project/:index',upload.single('inputImages') ,function (request, response) {
        let id = request.params.index

        
        let { inputProjectName: name, startDate: start_date, endDate: end_date, inputDesc: description, inputTech = '', } = request.body
        
        
        let technologies = `{${Array.isArray(inputTech) ? inputTech.join(', ') : inputTech}}`
        let image = request.file.filename
        let query = `UPDATE tb_projects SET name='${name}', start_date='${start_date}', end_date='${end_date}', description='${description}', image='${image}',technologies='${technologies}'
            WHERE id='${id}';`

        client.query(query, function (err, result) {
            if (err) throw err

            response.redirect("/")
        })


        // response.redirect("/")
    })

    app.get('/register', function (request, response) {
        response.render('register')
    })

    app.post('/register', function (request, response) {

        // console.log(request.body);
        let { inputName, inputEmail, inputPassword } = request.body

        const hashedPassword = bcrypt.hashSync(inputPassword, 10)

        let query = `INSERT INTO tb_user(name, email, password)
        VALUES ('${inputName}', '${inputEmail}', '${hashedPassword}');`

        client.query(query, function (err, result) {
            if (err) throw err
            response.redirect('/login')
        })


    })

    app.get('/login', function (request, response) {
        response.render('login')
    })

    app.post('/login', function (request, response) {

        let { inputEmail, inputPassword } = request.body

        let query = `SELECT * FROM tb_user WHERE email='${inputEmail}'`;

        client.query(query, function (err, result) {
            if (err) throw err

            // console.log(result.rows.length);
            console.log(result.rows[0]);

            if (result.rows.length == 0) {
                console.log('Email belum terdaftar');
                request.flash('danger', 'Email belum terdaftar')
                return response.redirect('/login')


            }

            const isMatch = bcrypt.compareSync(inputPassword, result.rows[0].password)
            // console.log(isMatch);

            if (isMatch) {
                console.log('Login Berhasil');

                request.session.isLogin = true
                request.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }
                request.flash('success', 'Login berhasil')
                response.redirect('/')

            } else {
                console.log('Password Salah');
                request.flash('danger', 'Password salah')
                return response.redirect('/login')

            }

        })
    })

    app.get('/logout', function (request, response) {

        request.session.destroy()

        response.redirect('/login')
    })

})

function getStart(start) {
    let d = new Date(start),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) {
        month = '0' + month
    }

    if (day.length < 2) {
        day = '0' + day
    }

    return [year, month, day].join('-')

}

function getEnd(end) {
    let d = new Date(end),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) {
        month = '0' + month
    }

    if (day.length < 2) {
        day = '0' + day
    }

    return [year, month, day].join('-')
}

function getFullTime(time) {

    let month = ["Januari", "Febuari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "Nopember", "Desember"]

    let date = new Date(time).getDate()
    let monthIndex = new Date(time).getMonth()
    let year = new Date(time).getFullYear()

    // let hours = time.getHours()
    // let minutes = time.getMinutes()

    // if (hours < 10) {
    //     hours = "0" + hours
    // } else if (minutes < 10) {
    //     minutes = "0" + minutes
    // }

    // 12 Agustus 2022 09.04
    let fullTime = `${date} ${month[monthIndex]} ${year}`
    // console.log(fullTime);
    return fullTime
}

function getDistanceTime(start, end) {

    let timeNow = end
    let timePost = start

    let distance = timeNow - timePost
    // console.log(distance);

    let milisecond = 1000 // 1 detik 1000 milisecond
    let secondInHours = 3600 // 1 jam sama dengan 3600 detik
    let hoursInDay = 24 // 1 hari 24 jam
    let daysInMonth = 30 // 1 bulan 30 hari
    let monthsInYear = 12 // 1 tahun 12 bulan

    let distanceYear = Math.floor(distance / (milisecond * secondInHours * hoursInDay * daysInMonth * monthsInYear))
    let distanceMonth = Math.floor(distance / (milisecond * secondInHours * hoursInDay * daysInMonth))
    let distanceDay = Math.floor(distance / (milisecond * secondInHours * hoursInDay))
    let distanceHours = Math.floor(distance / (milisecond * 60 * 60))
    let distanceMinutes = Math.floor(distance / (milisecond * 60))
    let distanceSeconds = Math.floor(distance / milisecond)

    if (distanceYear > 0) {
        return `${distanceYear} tahun`
    } else if (distanceMonth > 0) {
        return `${distanceMonth} bulan`
    } else if (distanceDay > 0) {
        return `${distanceDay} hari`
    } else if (distanceHours > 0) {
        return `${distanceHours} jam`
    } else if (distanceMinutes > 0) {
        return `${distanceMinutes} menit`
    } else {
        return `${distanceSeconds} detik`
    }
}



app.listen(5000, function () {
    console.log(`Server running on port ${port}`);
})
