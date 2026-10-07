import Mailgen from "mailgen";
import Nodemailer from "nodemailer";

//method for sending email
const sendEmail = async (options)=>{
    const mailGenerator = new Mailgen({
        theme: "default",
        product:{
            name:"Task Manager",
            link : "https://taskmanagelink.com"
        }
    })
    // for those who doesnt support html
const emailTextual = mailGenerator.generatePlaintext(options.mailgencontent)
//for those who support html
const emailhtml = mailGenerator.generate(options.mailgencontent)

// this will take the email and send it to this
 const transporter = Nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth:{
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS
    }
  })

const mail ={
    from: "mail.taskmanager@email.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailhtml
}

   try{
    await transporter.sendMail(mail)
   }
   catch(error){
    console.error("email service failed silently. Make sure that you have provided your MAILTRAP credentials in the .env file")
    console.error("Error", error)
   }

}


const emailVerificationMailgenContent = (username, verificationUrl) =>{
    return{
        body:{
            name: username ,
            intro: "welcome to our App! we' are exited to have you",
            action:{
                instructions : "to verify your email please click on the following ",
                button:{
                    color: "#1aae5aff",
                    text: "verify your email",
                    link: verificationUrl
                },
            },
            outro: "heed help or have queries ? just reply to this email ,we would love to help."
        },
    };
};
const forgotPasswordMailgenContent = (username, passwordResetUrl) =>{
    return{
        body:{
            name: username ,
            intro: "we got a req to reset the password",
            action:{
                instructions : "to reset your email please click on the following ",
                button:{
                    color: "#1aae5aff",
                    text: " reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "heed help or have queries ? just reply to this email ,we would love to help."
        },
    };
} ;

export { emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
};














// import Mailgen from "mailgen";
// import Nodemailer from "nodemailer";

// //method for sending email
// const sendEmail = async (options)=>{
//     const mailGenerator = new Mailgen({
//         theme: "default",
//         product:{
//             name:"Task Manager",
//             link : "hhtps://taskmanagelink.com"
//         }
//     })
//     // for those who doesnt support html
// const emailTextual = mailGenerator.generatePlaintext(option.mailgencontent)
// //for those who support html
// const emailhtml = mailGenerator.generatePlaintext(option.mailgencontent)

// // this will take the email and send it to this
//  const transporter =nodemailer.createTransport({
//     host: process.env.MAILTRAP_SMTP_HOST,
//     port: process.env.MAILTRAP_SMTP_PORT,
//     auth:{
//         user: process.env.MAILTRAP_SMTP_USER,
//         pass: process.env.MAILTRAP_SMTP_PASS
//     }
//   })

// const mail ={
//     from: "mail.taskmanager@email.com",
//     to: options.email,
//     subject: options.email,
//     text: emailTextual,
//     html: emailhtml
// }

//    try{
//     await transporter.sendEmail(mail)
//    }
//    catch(error){
//     console.error("email service failed silently. Make sure that you have provided your MAILTRAP credentials in the .env file")
//     console.error("Error", error)
//    }

// }


// const emailVerificationMailgenContent = (username, verificationUrl) =>{
//     return{
//         body:{
//             name: username ,
//             intro: "welcome to our App! we' are exited to have you",
//             action:{
//                 intructions : "to verify your email please click on the following ",
//                 button:{
//                     color: "#1aae5aff",
//                     text: "verify your email",
//                     link: verificationUrl
//                 },
//             },
//             outro: "heed help or have queries ? just reply to this email ,we would love to help."
//         },
//     };
// };
// const forgotPasswordMailgenContent = (username, passwordResetUrl) =>{
//     return{
//         body:{
//             name: username ,
//             intro: "we got a req to reset the password",
//             action:{
//                 intructions : "to reset your email please click on the following ",
//                 button:{
//                     color: "#1aae5aff",
//                     text: " reset password",
//                     link: passwordResetUrl,
//                 },
//             },
//             outro: "heed help or have queries ? just reply to this email ,we would love to help."
//         },
//     };
// } ;

// export { emailVerificationMailgenContent,
//     forgotPasswordMailgenContent,
//     sendEmail,
// };