const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large YAML files
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('build')); // Serve React build files

// API Routes
app.get('/api/menu-data', async (req, res) => {
  try {
    const yamlPath = path.join(__dirname, 'main.en.yaml');
    const yamlContent = await fs.readFile(yamlPath, 'utf8');
    const menuData = yaml.load(yamlContent);
    res.json(menuData);
  } catch (error) {
    console.error('Error reading YAML file:', error);
    res.status(500).json({ error: 'Failed to read menu data' });
  }
});

app.post('/api/menu-data', async (req, res) => {
  try {
    const menuData = req.body;
    
    // Validate the payload
    if (!menuData || !menuData.menu || !menuData.menu.main) {
      return res.status(400).json({ error: 'Invalid menu data structure' });
    }
    
    console.log(`Saving menu data with ${menuData.menu.main.length} items`);
    
    const yamlPath = path.join(__dirname, 'main.en.yaml');
    
    // Convert back to YAML format
    const yamlContent = yaml.dump(menuData, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    
    // Write to file
    await fs.writeFile(yamlPath, yamlContent, 'utf8');
    
    console.log('Menu data saved successfully');
    res.json({ message: 'Menu data saved successfully' });
  } catch (error) {
    console.error('Error saving YAML file:', error);
    res.status(500).json({ error: 'Failed to save menu data' });
  }
});

// Serve the React app for any non-API routes (but be more specific)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/static/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', req.path));
});

// Catch-all for SPA routing - but be careful with the path
app.get('*', (req, res) => {
  // Only serve index.html for routes that don't start with /api
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
