//install-> npm i bcrypt jsonwebtoken cookie-parser

const express=require('express')
const app =express()
const userModel=require("./models/user");
const postmodel=require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt=require('bcrypt')
const jwt=require("jsonwebtoken");
const user = require('./models/user');
const postModel = require('./models/post');
const crypto=require("crypto")
const path = require('path'); 
const upload=require("./config/multerconfig")
const { createRequire } = require('module');
const multerconfig=require("./config/multerconfig")
//multer commented in lecture 21
//const multer=require("multer")
app.set("view engine","ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")))
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/images/uploads')
//     },
//     filename: function (req, file, cb) {
//       crypto.randomBytes(12,function(err,bytes){
//         const fn =bytes.toString("hex")+path.extname(file.originalname)
//         cb(null,fn )
//       })
      
//     }
//   })
  
//   const upload = multer({ storage: storage })


  //path.extname()->se extension nikal aayega file ka
app.get("/",(req,res)=>{
    res.render("index")

})

app.get("/profile/upload",(req,res)=>{
    res.render("profileupload")

})
app.post("/upload",isLoggedIn,upload.single("image"),async (req,res)=>{
   let user=await userModel.findOne({email:req.user.email})
   user.profilepic=req.file.filename;
   await user.save();
   res.redirect("/profile")
// console.log(req.file);

})
//->these are commented in lecture 21
// app.get("/test", (req,res)=>{
 
//     res.render("test")

// })
// app.post("/upload", upload.single("image"),(req,res)=>{
 
//     console.log(req.file)


//     //text file ka data body me hoga;


// })
//memory storage->data base pe upload karne ke liiye hota hai
//disc storage->server pe upload ke liye


app.get("/login", (req,res)=>{
 
    res.render("login")

})

app.get("/profile",isLoggedIn,async (req,res)=>{
    let user=  await userModel.findOne({email:req.user.email}).populate("posts")

    res.render("profile",{user})

})
app.get("/like/:id",isLoggedIn,async (req,res)=>{
    let post=  await postModel.findOne({_id:req.params.id}).populate("user")
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid);

    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }



  await post.save();
  res.redirect("/profile")

})
app.get("/profile/posts", isLoggedIn, async (req, res) => {
    try {
        // Fetch the user along with their posts
        let user = await userModel.findOne({ email: req.user.email }).populate("posts");

        // Fetch all posts (optional, if you want posts from all users)
        let posts = await postModel.find().populate("user");

        // Render the profile page with the user and posts data
        res.render("posts", { user, posts });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the profile.");
    }
});



app.get("/update/:id",isLoggedIn,async (req,res)=>{
    let post=  await postModel.findOne({_id:req.params.id}).populate("user")
    res.render("edit",{post})


})
app.get("/edit/:id",isLoggedIn,async (req,res)=>{
    let post=  await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content}).populate("user")
    res.redirect("profile")


})








//splice matlab hatao
app.post("/post",isLoggedIn,async (req,res)=>{
    let user=  await userModel.findOne({email:req.user.email})
    let  {content}=req.body;
   let post= await postModel.create({
        user:user._id,
        content
    })
    user.posts.push(post._id)
    await user.save();
    res.redirect("/profile")
 

})


//find one us email se koi alredy account hai kya
app.post("/register",async(req,res)=>{
    let {email,password,username,name,age}=req.body
    let user =await userModel.findOne({email:email})
    if(user) return res.status(500).send("user already registered")
        bcrypt.genSalt(10,(err,salt)=>{
   bcrypt.hash(password,salt,async (err,hash)=>{
  let user= await userModel.create({
    username,
    email,
    age,
    name,
    password:hash
   })
   let token=jwt.sign({email:email,userid:user._id},"shhhh")
   res.cookie("token",token)
   res.redirect("/login")
   
   



   })
        })

  
})


app.post("/login",async(req,res)=>{
    let {email,password}=req.body
    let user =await userModel.findOne({email:email})
    if(!user) return res.status(500).send(" something went wrong ")
        bcrypt.compare(password,user.password,function(err,result){
if(result) {
    let token=jwt.sign({email:email,userid:user._id},"shhhh")
    res.cookie("token",token)
    res.status(200).redirect("/profile")

}
        else res.redirect("/login")
    
    
        })
       
   
        

  
})

app.get("/logout",(req,res)=>{
  res.cookie("token","")
  res.redirect("/login")

})

function isLoggedIn(req,res,next){
    if(req.cookies.token=="") res.redirect("/login")
        else{
   let data= jwt.verify(req.cookies.token,"shhhh")
   req.user=data;
   next()
        }
   
}

app.listen(3000)