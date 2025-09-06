# Menu Bestie

[menu-bestie.netlify.app](https://menu-bestie.netlify.app/)

A web interface for editing the left-nav menu of [Datadog's public documentation site](https://docs.datadoghq.com/), so you don't have to wade through [1000+ lines of YAML config file](https://github.com/DataDog/documentation/blob/master/config/_default/menus/main.en.yaml) every time you want to move a menu item.

## Usage

1. Go to [menu-bestie.netlify.app](https://menu-bestie.netlify.app/) and upload your local version of [the left nav config file](https://github.com/DataDog/documentation/blob/master/config/_default/menus/main.en.yaml).

2. Make your modifications using the UI.
   - Resolve missing and duplicate `identifier` errors
   - Add, edit, and delete items

3. Click **Download new main.en.yaml** to download your updated version.

**Note**: Refreshing the page wipes out your changes.


### Features

- Validates your config YAML, surfaces missing and duplicate `identifier` values, and provides a friendly interface to resolve these issues
- When two items have the same `parent` and `weight`, the weight is highlighted in red. This isn't a breaking error, it's just unintended ambiguity.

## Working on menu-bestie

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/cswatt/menu-bestie.git
cd menu-bestie

# Install dependencies
npm install
```

### Development

```bash
# Start both React dev server and Express backend
npm run dev
```

This runs:
- Express server on port 3001
- React development server on port 3000

### Individual Commands

```bash
npm run server    # Start Express server only
npm start         # Start React development server only
npm run build     # Build React app for production
```

### Testing

```bash
# Run all tests in watch mode
npm test

# Run tests once without watch
npm test -- --watchAll=false

# Run specific test file
npm test -- --testPathPattern=MenuEditor.simple.test.jsx

# Run with coverage report
npm test -- --coverage --watchAll=false
```

**Test Status**: ✅ 59/59 tests passing across all test suites

### Architecture

#### Frontend (React)
- **Main Component**: `src/components/MenuEditor.jsx`
- **UI Framework**: Radix UI with Tailwind CSS
- **State Management**: React hooks
- **YAML Processing**: js-yaml library

#### Backend (Express.js)
- **Server**: `server.js`
- **Storage**: In-memory (temporary)
- **API Endpoints**:
  - `GET /api/menu-data` - Retrieve menu data
  - `POST /api/menu-data` - Update menu data
  - `GET /api/download-yaml` - Download YAML
  - `POST /api/reset` - Reset to original

#### Dependencies
- **Frontend**: React, Radix UI, Tailwind CSS, js-yaml, Lucide React
- **Backend**: Express, cors, js-yaml, concurrently
- **Testing**: Jest, React Testing Library, user-event, supertest

### Claude Code workflow

#### Context management

The following files provide Claude Code with context:

- **`CLAUDE.md`** - Primary context file with project details and development guidelines
- **`PLAN.md`** - Detailed improvement roadmap and future enhancements
- **`TESTING.md`** - Testing strategy and test suite documentation
- **`README.md`** - This file, providing quick start and overview