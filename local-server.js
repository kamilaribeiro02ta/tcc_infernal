const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const sessionsDir = path.join(dataDir, "sessions");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(sessionsDir, { recursive: true });

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]", "utf8");
}

function readUsers() {
  try {
    const raw = fs.readFileSync(usersFile, "utf8");
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("Erro ao ler usuários:", error);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new FileStore({
      path: sessionsDir,
      ttl: 60 * 60 * 24 * 365,
      retries: 1
    }),
    name: "zuz.sid",
    secret:
      process.env.SESSION_SECRET ||
      "zuz-dev-secret-troque-em-producao-2026",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 365
    }
  })
);

function requireAuth(req, res, next) {
  if (req.session?.userId) {
    return next();
  }

  return res.redirect("/Login-2/login-2.html");
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "ZUZ",
    message: "Servidor Node funcionando"
  });
});

app.post("/api/auth/register", async (req, res) => {
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Preencha todos os campos."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      ok: false,
      message: "A senha precisa ter pelo menos 8 caracteres."
    });
  }

  const users = readUsers();
  const exists = users.some(user => user.email === email);

  if (exists) {
    return res.status(409).json({
      ok: false,
      message: "Já existe uma conta com este email."
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: `${firstName} ${lastName}`.trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);

  req.session.userId = user.id;

  req.session.save(error => {
    if (error) {
      console.error("Erro ao salvar sessão:", error);
      return res.status(500).json({
        ok: false,
        message: "A conta foi criada, mas não foi possível iniciar a sessão."
      });
    }

    return res.status(201).json({
      ok: true,
      user: publicUser(user)
    });
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Informe email e senha."
    });
  }

  const users = readUsers();
  const user = users.find(item => item.email === email);

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "Email ou senha incorretos."
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({
      ok: false,
      message: "Email ou senha incorretos."
    });
  }

  req.session.userId = user.id;

  req.session.save(error => {
    if (error) {
      console.error("Erro ao salvar sessão:", error);
      return res.status(500).json({
        ok: false,
        message: "Não foi possível iniciar a sessão."
      });
    }

    return res.json({
      ok: true,
      user: publicUser(user)
    });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      authenticated: false
    });
  }

  const users = readUsers();
  const user = users.find(item => item.id === req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({
      ok: false,
      authenticated: false
    });
  }

  return res.json({
    ok: true,
    authenticated: true,
    user: publicUser(user)
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error("Erro ao encerrar sessão:", error);
      return res.status(500).json({
        ok: false,
        message: "Não foi possível encerrar a sessão."
      });
    }

    res.clearCookie("zuz.sid");
    return res.json({
      ok: true
    });
  });
});

app.get("/perfil/perfil.html", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "perfil", "perfil.html"));
});

app.get("/perfil", requireAuth, (req, res) => {
  res.redirect("/perfil/perfil.html");
});

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ZUZ rodando em http://localhost:${PORT}`);
});
