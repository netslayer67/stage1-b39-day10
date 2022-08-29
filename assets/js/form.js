function submitData(){

    let name = document.getElementById("inputName").value
    let email = document.getElementById("inputEmail").value
    let phone = document.getElementById("inputNumber").value
    let subject = document.getElementById("inputSubject").value
    let message = document.getElementById("inputMessage").value

    // if(name == "" || email == "" || phone == ""){
    //    return alert("semua kolom wajib diisi")
    // } 

    if(email == ""){
       return alert("Name wajib diisi")
    } else if(email == ""){
       return alert("Email wajib diisi")
    } else if(phone == ""){
       return alert("Phone wajib diisi")
    } else if(subject == ""){
       return alert("Subject wajib diisi")
    } else if(message == ""){
       return alert("Message wajib diisi")
    }

    // console.log(name);
    // console.log(email);
    // console.log(phone);
    // console.log(subject);
    // console.log(message);

    let emailReceiver = "jilliyan67@gmail.com"
    
    // membuat tag a
    // <a href="mailto:samsul@mail.com.com?subject=hallo&body=Isi pesan">example</a>
    let a = document.createElement('a')
    a.href=`mailto:${emailReceiver}?subject=${subject}&body=Hallo nama saya ${name}, ${message}, silahkan kontak saya dengan email ${email}, telp ${phone}`
    a.click()

    let siswa = {
        name,
        email,
        phone,
        subject,
        message
    }
    console.log(siswa);   
}