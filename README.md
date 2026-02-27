# Dofus Retro - Perceptor Tracker

An interactive Angular 21 application for tracking perceptors (tax collectors) across all maps in Dofus Retro.

## Features

- 🗺️ **Interactive Map Grid**: Visual grid representing the entire Dofus Retro world (positions from [-26, -56] to [38, 30])
- 🏰 **Perceptor Management**: Click on any cell to add or update a perceptor
- 📅 **Date Tracking**: Automatically tracks when a perceptor was first seen and last seen
- 💾 **Local Storage**: All data is saved in your browser's local storage
- 📤 **Export/Import**: Export your data as JSON for backup or sharing
- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, responsive interface
- ⚡ **Angular Signals**: Uses the latest Angular 21 signals for reactive state management

## Technologies

- **Angular 21**: Latest version with standalone components
- **Tailwind CSS 3**: Utility-first CSS framework
- **TypeScript**: Type-safe development
- **Local Storage API**: Client-side data persistence

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PERCO_TRACKER_FRONTEND
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

4. Open your browser and navigate to `http://localhost:4200/`

## Usage

### Adding a Perceptor

1. Click on any empty cell in the map grid
2. A perceptor icon (🏰) will appear at that position
3. The current date/time will be set as both "first seen" and "last seen"

### Updating a Perceptor

1. Click on an existing perceptor (cell with 🏰 icon)
2. The "last seen" date will be updated to the current date/time

### Deleting a Perceptor

1. Click on a perceptor to select it
2. Click the "Delete" button in the info bar at the top

### Exporting Data

Click the "Export JSON" button to download all your perceptor data as a JSON file.

### Importing Data

Click the "Import JSON" button and select a previously exported JSON file to restore your data.

### Clearing All Data

Click the "Clear All" button to remove all perceptors from your tracker.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── map/
│   │       ├── map.component.ts        # Main map component
│   │       ├── map.component.html      # Map template
│   │       └── map.component.css       # Map styles
│   ├── models/
│   │   ├── perceptor.model.ts         # Perceptor data model
│   │   └── map.model.ts                # Map configuration
│   ├── services/
│   │   └── perceptor.service.ts       # Perceptor management service
│   ├── app.ts                          # Root component
│   └── app.config.ts                   # App configuration
├── styles.css                          # Global styles with Tailwind
└── index.html                          # Entry HTML file
```

## Data Model

### Perceptor

```typescript
interface Perceptor {
  id: string;              // Unique identifier
  position: Position;      // Map coordinates
  firstSeenDate: Date;     // When first spotted
  lastSeenDate: Date;      // Last update time
  notes?: string;          // Optional notes (future feature)
}
```

### Position

```typescript
interface Position {
  x: number;  // X coordinate
  y: number;  // Y coordinate
}
```

## Future Enhancements

- Add notes/comments for each perceptor
- Filter perceptors by date range
- Search by coordinates
- Multiple color-coded perceptor types
- Guild/alliance management
- Server-side storage option
- Statistics and analytics
- Mobile-responsive optimizations

## Development Commands

```bash
# Start development server
ng serve

# Build for production
ng build

# Run tests
ng test

# Run linting
ng lint
```

## Contributing

Feel free to open issues or submit pull requests to improve the tracker!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the Dofus Retro community
- Inspired by the need for better perceptor tracking
