const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")



const app = express()
const PORT = 3000
const SECRET_KEY = "DANLEY-YAP-GALAN-MARCH-31-2004"


app.use(cors({
    origin: ["http://127.0.0.1:5500"]
}))


app.use(express.json())


let users = [
    {
        id: 1,
        firstName: "admin",
        lastName: "user",
        email: "admin@example.com",
        password: "$2b$10$aPbnWecBMzkQdNlVoNRIouuFU3o/F6Klg4v1.FIEhb.VOE7q98XdC",
        role: "admin"
    },
    {
        id: 2,
        firstName: "alice",
        lastName: "go",
        email: "user@email.com",
        password: "$2b$10$jg1uY57jx7pPMcyap0e6yeyb3HpkISic2RXQq1KCj73nUI.P.t23i",
        role: "user"
    }
]



/// AUTH ROUTES 


// REGISTER ROUTE
app.post("/api/register", async (req, res) => {
    const { firstName, lastName, email, password, role = "user" } = req.body

    if (!email || !password) {
        return res.status(409).json({ error: "Email and Password required" })
    }

    const user = users.find(u => u.email === email)

    if (user) {
        return res.status(409).json({ error: "User already exists!" })
    }

    const hashPassword = await bcrypt.hash(password, 10)
    const newUser = {
        id: users.length + 1,
        firstName,
        lastName,
        email,
        password: hashPassword,
        role
    }


    users.push(newUser)

    console.log("current all user")
    console.log(users)
    return res.status(201).json({ message: "User Created Successfully!" })

})



// LOGIN ROUTE
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body


    const user = users.find(u => u.email === email)

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: "Invalid Credentials" })
    }


    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" }
    )


    return res.status(200).json({ token, user })

})





// PROTECTED ROUTES
app.get("/api/profile", authenticateToken, async (req, res) => {
    const fullUser = users.find(u => u.id === req.user.id);

    if (!fullUser) {
        return res.status(404).json({ error: "User not found" });
    }


    const user = {
        id: fullUser.id,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        email: fullUser.email,
        role: fullUser.role
    }
    res.json({ user });
})


app.get("/api/admin/dashbaord", authenticateToken, authorizeRole("admin"), (req, res) => {
    res.json({ message: "Welcome to admin DashBaord", data: "Secret admin info" })
})


// PUBLIC ROUTE
app.get("/api/content/guest", (req, res) => {
    res.status(200).json({ message: "Public content all visitors" })
})




/// MIDDLEWARES

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({ error: "Access Token Required" })
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expire token" })

        req.user = user

        next()
    })
}


function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: "Access denied: Insufficient Permission" })
        }

        next()
    }
}










app.listen(PORT, () => {
    console.log(`BACKEND RUNNING ON http://localhost:${PORT}`)
    console.log("_______Try loggging in with:_______")
    console.log("   --Admin: EMAIL: admin@example.com,     PASSWORD: admin123")
    console.log("   --User:  EMAIL: user@email.com,     PASSWORD: user123")
})