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

// Store temporary menu data in memory
let temporaryMenuData = null;

// API Routes
app.get('/api/menu-data', async (req, res) => {
  try {
    const yamlPath = path.join(__dirname, 'main.en.yaml');
    const yamlContent = await fs.readFile(yamlPath, 'utf8');
    const menuData = yaml.load(yamlContent);
    
    // Initialize temporary data if not set
    if (!temporaryMenuData) {
      temporaryMenuData = menuData;
    }
    
    res.json(temporaryMenuData);
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
    
    console.log(`Updating temporary menu data with ${menuData.menu.main.length} items`);
    
    // Store in temporary memory only - don't write to file
    temporaryMenuData = menuData;
    
    console.log('Temporary menu data updated successfully');
    res.json({ message: 'Temporary menu data updated successfully' });
  } catch (error) {
    console.error('Error updating temporary menu data:', error);
    res.status(500).json({ error: 'Failed to update temporary menu data' });
  }
});

// New endpoint to download the modified YAML
app.get('/api/download-yaml', async (req, res) => {
  try {
    if (!temporaryMenuData) {
      return res.status(400).json({ error: 'No temporary menu data available' });
    }
    
    // Convert to YAML format
    const yamlContent = yaml.dump(temporaryMenuData, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Disposition', 'attachment; filename="main.en.yaml"');
    
    res.send(yamlContent);
  } catch (error) {
    console.error('Error generating YAML download:', error);
    res.status(500).json({ error: 'Failed to generate YAML download' });
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
  console.log(`Note: Changes are stored in memory only. Use Download button to save changes.`);
});
