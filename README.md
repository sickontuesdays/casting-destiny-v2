# Casting Destiny v2

An AI-powered Destiny 2 build optimization tool that helps guardians create the perfect loadouts for any activity.

## ✨ Features

- **🧠 AI-Powered Build Generation**: Natural language processing to understand build requests
- **⚡ Advanced Synergy Analysis**: Detect powerful item combinations and synergies
- **🎯 Activity-Specific Optimization**: Builds tailored for raids, PvP, dungeons, and more
- **📊 Enhanced Performance Scoring**: Comprehensive build analysis and scoring
- **👥 Social Features**: Friend system and build sharing
- **🔗 Bungie API Integration**: Real-time access to your Destiny 2 inventory
- **💾 Build Management**: Save, organize, and track your favorite builds

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18
- **Styling**: CSS3 with custom Destiny 2 theme
- **Authentication**: Custom JWT with Bungie OAuth
- **AI/Intelligence**: Custom NLP and analysis engines
- **API**: Bungie.net API integration
- **Deployment**: Vercel-ready with standalone options

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- A Bungie.net developer account and application
- Basic understanding of Destiny 2 mechanics (helpful but not required)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/casting-destiny-v2.git
   cd casting-destiny-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your Bungie API credentials** (see Configuration section below)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Bungie API Setup

1. Visit [Bungie.net Application Portal](https://www.bungie.net/en/Application)
2. Create a new application with these settings:
   - **Application Name**: Casting Destiny v2 (or your preferred name)
   - **Application Status**: Private
   - **Website**: http://localhost:3000 (for development)
   - **OAuth Client Type**: Confidential
   - **Redirect URL**: http://localhost:3000/api/auth/bungie-auth
   - **Scope**: Read your Destiny vault and character inventory
   - **Origin Header**: http://localhost:3000

3. Copy your credentials to `.env.local`:
   ```bash
   BUNGIE_CLIENT_ID=your_client_id_here
   BUNGIE_CLIENT_SECRET=your_client_secret_here
   BUNGIE_API_KEY=your_api_key_here
   ```

### Environment Variables

Required variables for `.env.local`:

```bash
# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-character-secret

# Bungie API
BUNGIE_CLIENT_ID=your_bungie_client_id
BUNGIE_CLIENT_SECRET=your_bungie_client_secret
BUNGIE_API_KEY=your_bungie_api_key

# Admin
ADMIN_PASSWORD=your_secure_admin_password

# Environment
NODE_ENV=development
```

## 📂 Project Structure

```
casting-destiny-v2/
├── components/              # React components
│   ├── AdminPanel.js       # System administration
│   ├── BuildCreator.js     # Advanced build creation
│   ├── BuildDisplay.js     # Build visualization
│   ├── FriendSystem.js     # Social features
│   ├── Layout.js           # App layout wrapper
│   ├── NaturalLanguageInput.js # AI-powered input
│   └── UserInventory.js    # Inventory management
├── lib/                    # Core libraries
│   ├── destiny-intelligence/
│   │   ├── build-intelligence.js # Main AI engine
│   │   ├── synergy-engine.js    # Synergy detection
│   │   └── text-parser.js       # NLP processing
│   ├── bungie-api.js       # Bungie API wrapper
│   ├── enhanced-build-scorer.js # Build scoring
│   ├── manifest-manager.js # Game data management
│   └── useAuth.js          # Authentication hook
├── pages/
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── bungie/        # Bungie API proxies
│   │   └── friends/       # Social features
│   ├── _app.js            # App initialization
│   ├── index.js           # Home page
│   ├── admin.js           # Admin panel
│   └── builds.js          # Saved builds
├── styles/                 # CSS styles
│   ├── globals.css        # Global styles
│   ├── destiny-theme.css  # Destiny 2 theme
│   └── components.css     # Component styles
├── public/                 # Static assets
├── .env.example           # Environment template
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

## 🎮 Usage

### Basic Build Creation

1. **Sign in** with your Bungie.net account
2. **Describe your ideal build** in natural language:
   - "High mobility Hunter build for PvP"
   - "Titan tank build for raids with maximum survivability"
   - "Warlock grenade spam build using Necrotic Grip"

3. **Review the generated build** with detailed analysis
4. **Save and share** your favorite builds

### Advanced Features

- **Inventory Integration**: Use only items you actually own
- **Exotic Locking**: Build around specific exotic items
- **Activity Optimization**: Specialized builds for different game modes
- **Synergy Analysis**: Discover powerful item combinations
- **Performance Scoring**: Understand build effectiveness

### Admin Panel

Access the admin panel at `/admin` to:
- Monitor system performance
- View user statistics
- Manage intelligence features
- Export system data

## 🤖 AI Intelligence System

The heart of Casting Destiny v2 is its AI intelligence system that includes:

### Natural Language Processing
- Understands complex build requests
- Extracts intent, requirements, and preferences
- Provides confidence scoring for interpretations

### Synergy Engine
- Detects item combinations and interactions
- Analyzes stat distributions and breakpoints
- Identifies potential conflicts and optimizations

### Build Scoring
- Multi-factor performance analysis
- Activity-specific optimization metrics
- Comparative build evaluation

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run clean        # Clean build artifacts
```

### Code Structure

The application follows Next.js conventions with additional organization:

- **Components**: Reusable UI components
- **Lib**: Core business logic and utilities
- **Pages**: Route handlers and page components
- **Styles**: Organized CSS with component-specific styles

### Key Design Principles

1. **Performance First**: Optimized for fast loading and responsive interactions
2. **User Experience**: Clean, intuitive interface inspired by Destiny 2's design
3. **Reliability**: Robust error handling and fallback systems
4. **Extensibility**: Modular architecture for easy feature additions

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Update `NEXTAUTH_URL` to your production domain
4. Update Bungie application settings with production URLs

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Configure reverse proxy (nginx/Apache) if needed

### Environment-Specific Notes

- **Development**: Uses file-based storage for builds and user data
- **Production**: Includes automatic cleanup and optimization features
- **Serverless**: Compatible with Vercel and similar platforms

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application is not affiliated with or endorsed by Bungie, Inc. Destiny and Destiny 2 are trademarks of Bungie, Inc. This tool is created by the community for the community.

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join our Discord for discussions and support

## 🔮 Roadmap

- [ ] Enhanced exotic synergy detection
- [ ] Seasonal artifact integration  
- [ ] Weapon perk analysis
- [ ] Build comparison tools
- [ ] Community build sharing
- [ ] Mobile app companion
- [ ] Advanced analytics dashboard

## 🙏 Acknowledgments

- Bungie for the incredible Destiny 2 universe and API
- The Destiny 2 community for inspiration and feedback
- Contributors and testers who help improve the tool

---

**Made with ❤️ for the Destiny 2 community**