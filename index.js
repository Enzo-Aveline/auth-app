const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;
const secretKey = 'your_secret_key';

app.use(bodyParser.json());

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.STRING
  }
});

sequelize.sync();

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'No token provided' });
  }
};

app.get('/users', authenticate, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.get('/users/:id', authenticate, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.put('/users/:id', authenticate, async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const [updated] = await User.update({ username, password: hashedPassword }, {
    where: { id: req.params.id }
  });
  if (updated) {
    const updatedUser = await User.findByPk(req.params.id);
    res.json(updatedUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/users/:id', authenticate, async (req, res) => {
  const deleted = await User.destroy({
    where: { id: req.params.id }
  });
  if (deleted) {
    res.status(204).json();
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});