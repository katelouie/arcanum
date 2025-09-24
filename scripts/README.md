# Twine Build Scripts

Comprehensive toolchain for building, managing, and converting Twine interactive fiction stories using tweego.

## Overview

This directory contains two complementary scripts for working with Twine stories:

- **`build-twine.sh`** - Shell script for quick builds and simple workflows
- **`build_twine.py`** - Python script with advanced features and configuration
- **`twine-config.json`** - Configuration file for the Python script

Both scripts support the same core functionality but offer different levels of features and complexity.

## Quick Start

### Prerequisites

1. **Install tweego** - The Twee compiler
   ```bash
   # Download from: http://www.motoslave.net/tweego/
   # Ensure it's in your PATH
   source ~/.zshrc  # May be needed to refresh PATH
   tweego --version  # Verify installation
   ```

2. **Directory Structure**
   ```
   project/
   ├── twine-poc/                    # Source .twee files
   │   ├── story1.twee
   │   └── story2.twee
   ├── frontend/public/stories/      # Compiled HTML output
   │   ├── story1.html
   │   └── story2.html
   └── scripts/                      # Build scripts (this directory)
       ├── build-twine.sh
       ├── build_twine.py
       ├── twine-config.json
       └── README.md
   ```

### Basic Usage

**Shell Script (Quick and Simple):**
```bash
# Make executable (first time only)
chmod +x scripts/build-twine.sh

# Build all stories
./scripts/build-twine.sh build-all

# Build single story
./scripts/build-twine.sh build twine-poc/my-story.twee

# Watch for changes
./scripts/build-twine.sh watch
```

**Python Script (Advanced Features):**
```bash
# Build all stories
python scripts/build_twine.py build-all

# Build with validation
python scripts/build_twine.py build twine-poc/my-story.twee

# Watch mode with statistics
python scripts/build_twine.py watch
```

## Shell Script (`build-twine.sh`)

### Features

- ✅ Simple, dependency-free (just bash and tweego)
- ✅ Color-coded output for easy reading
- ✅ Watch mode for development
- ✅ Comprehensive logging
- ✅ File conversion between formats
- ✅ Cross-platform compatibility (macOS, Linux)

### Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `build` | Compile single .twee file | `./build-twine.sh build <file> [output]` |
| `build-all` | Compile all .twee files | `./build-twine.sh build-all` |
| `watch` | Auto-rebuild on changes | `./build-twine.sh watch` |
| `decompile` | HTML → .twee | `./build-twine.sh decompile <html> [output]` |
| `import` | Archive → .twee | `./build-twine.sh import <archive> [output]` |
| `export` | .twee → Archive | `./build-twine.sh export <twee> [format] [output]` |
| `clean` | Remove compiled files | `./build-twine.sh clean` |
| `list` | Show file status | `./build-twine.sh list` |
| `version` | Show configuration | `./build-twine.sh version` |
| `help` | Display help | `./build-twine.sh help` |

### Configuration

Edit variables at the top of the script:

```bash
TWEE_SOURCE_DIR="twine-poc"           # Source directory
HTML_OUTPUT_DIR="frontend/public/stories"  # Output directory
DEFAULT_FORMAT="sugarcube-2"          # Story format
WATCH_INTERVAL=2                      # Watch interval (seconds)
LOG_FILE="scripts/build.log"          # Log file location
```

### Examples

```bash
# Build specific story with custom output name
./build-twine.sh build twine-poc/tarot-story.twee enhanced-tarot

# Export to Twine 2 archive
./build-twine.sh export twine-poc/story.twee twine2 my-story

# Import from Twine GUI export
./build-twine.sh import downloads/story.tw2 imported-story

# Watch mode (runs until Ctrl+C)
./build-twine.sh watch
```

## Python Script (`build_twine.py`)

### Features

- ✅ JSON configuration support
- ✅ Advanced file validation
- ✅ Cross-platform compatibility
- ✅ Detailed logging and statistics
- ✅ File change detection with hashing
- ✅ Backup and recovery options
- ✅ Extensible architecture

### Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `build` | Compile single file | `python build_twine.py build <file> [output]` |
| `build-all` | Compile all files | `python build_twine.py build-all` |
| `watch` | Auto-rebuild on changes | `python build_twine.py watch` |
| `decompile` | HTML → .twee | `python build_twine.py decompile <html> [output]` |
| `import` | Archive → .twee | `python build_twine.py import <archive> [output]` |
| `export` | .twee → Archive | `python build_twine.py export <twee> [format] [output]` |
| `clean` | Remove compiled files | `python build_twine.py clean` |
| `list` | Show file status | `python build_twine.py list` |
| `validate` | Validate .twee files | `python build_twine.py validate` |
| `stats` | Show statistics | `python build_twine.py stats` |
| `save-config` | Save configuration | `python build_twine.py save-config` |

### Configuration (`twine-config.json`)

The Python script uses a JSON configuration file for advanced settings:

```json
{
  "source_dir": "twine-poc",
  "output_dir": "frontend/public/stories",
  "format": "sugarcube-2",
  "watch_interval": 2,
  "log_level": "INFO",
  "auto_create_dirs": true,
  "backup_on_overwrite": false,
  "validate_before_build": true,
  "show_statistics": true
}
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source_dir` | string | `"twine-poc"` | Source directory for .twee files |
| `output_dir` | string | `"frontend/public/stories"` | Output directory for HTML files |
| `format` | string | `"sugarcube-2"` | Default story format |
| `watch_interval` | number | `2` | File watching interval (seconds) |
| `log_level` | string | `"INFO"` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `auto_create_dirs` | boolean | `true` | Create directories if they don't exist |
| `backup_on_overwrite` | boolean | `false` | Create backups before overwriting |
| `validate_before_build` | boolean | `true` | Validate files before compilation |
| `show_statistics` | boolean | `true` | Display file size and build stats |

### Advanced Features

#### File Validation

The Python script includes comprehensive validation:

- ✅ Check for empty files
- ✅ Verify Start/StoryInit passages exist
- ✅ Validate balanced SugarCube tags (`<<` and `>>`)
- ✅ Validate balanced links (`[[` and `]]`)
- ✅ Basic syntax checking

#### Change Detection

Uses SHA256 hashing for accurate change detection:
- Only rebuilds files that have actually changed
- Detects new and deleted files
- More efficient than timestamp-based checking

#### Backup System

When `backup_on_overwrite` is enabled:
- Creates timestamped backups before overwriting
- Preserves previous versions for recovery
- Automatic cleanup options (planned feature)

#### Statistics and Logging

Detailed information about builds:
- File sizes and compression ratios
- Build times and success rates
- Error reporting with context
- Structured logging to file and console

### Examples

```bash
# Build with custom configuration
python build_twine.py --config my-config.json build-all

# Validate all files without building
python build_twine.py validate

# Show detailed statistics
python build_twine.py stats

# Export to Twine 1 format
python build_twine.py export twine-poc/story.twee twine1 legacy-story

# Watch mode with debug logging
# (Edit config to set log_level: "DEBUG")
python build_twine.py watch
```

## Integration with React App

### Output Structure

Both scripts output HTML files ready for use with the React `TwineStoryPlayer` component:

```
frontend/public/stories/
├── enhanced-tarot-story.html    # From enhanced-tarot-story.twee
├── tarot-story.html            # From tarot-story.twee
└── story-name.html             # From story-name.twee
```

### React Component Usage

```typescript
// In your React component
<TwineStoryPlayer
  storyPath="/stories/enhanced-tarot-story.html"
  onCardDrawn={handleCardDrawn}
  onChoiceMade={handleChoiceMade}
  clientId="demo-client"
  className="h-full"
/>
```

### Development Workflow

1. **Edit** .twee files in `twine-poc/`
2. **Watch** for changes: `./build-twine.sh watch`
3. **Develop** React components that load the HTML
4. **Test** in browser with live reload

## Supported Story Formats

| Format | ID | Description |
|--------|----|-------------|
| SugarCube 2 | `sugarcube-2` | **Default** - Modern, feature-rich |
| SugarCube 1 | `sugarcube-1` | Legacy SugarCube |
| Harlowe 3 | `harlowe-3` | Twine's default format |
| Harlowe 2 | `harlowe-2` | Previous Harlowe version |
| Chapbook | `chapbook-1` | Minimalist format |
| Snowman | `snowman-2` | Programmer-focused |

## Archive Formats

### Import/Export Support

| Format | Extension | Description |
|--------|-----------|-------------|
| Twine 2 Archive | `.tw2` | Modern Twine GUI format |
| Twine 1 Archive | `.tws` | Legacy Twine format |
| HTML | `.html` | Compiled story files |
| Twee 3 | `.twee` | Source code format |

### Conversion Examples

```bash
# Twine GUI → Source code
./build-twine.sh import story.tw2 my-story

# Source code → Twine GUI
./build-twine.sh export twine-poc/my-story.twee twine2 story

# HTML → Source code (decompile)
./build-twine.sh decompile frontend/public/stories/story.html recovered-story

# Legacy format conversion
./build-twine.sh import old-story.tws
./build-twine.sh export twine-poc/old-story.twee twine2 updated-story
```

## Error Handling and Troubleshooting

### Common Issues

**1. "tweego not found"**
```bash
# Solution: Install tweego and refresh PATH
source ~/.zshrc
which tweego  # Should show path to tweego
```

**2. "Permission denied"**
```bash
# Solution: Make scripts executable
chmod +x scripts/build-twine.sh
chmod +x scripts/build_twine.py
```

**3. "Source directory not found"**
```bash
# Solution: Create directory or update configuration
mkdir -p twine-poc
# OR edit config to point to correct directory
```

**4. "Validation failed"**
```
# Common validation errors and fixes:

# Missing Start passage
Error: No Start or StoryInit passage found
Fix: Add :: Start or :: StoryInit passage to your .twee file

# Unbalanced tags
Error: Mismatched tags: 5 open, 4 close
Fix: Check for missing >> or extra << in your SugarCube code

# Unbalanced links
Error: Mismatched links: 3 open, 2 close
Fix: Check for missing ]] or extra [[ in your links
```

### Debugging

**Shell Script Debugging:**
```bash
# Check log file for detailed errors
tail -f scripts/build.log

# Verbose tweego output
tweego --log-files --output story.html story.twee
```

**Python Script Debugging:**
```bash
# Enable debug logging
# Edit twine-config.json: "log_level": "DEBUG"
python build_twine.py build-all

# Check specific file validation
python build_twine.py validate
```

### Recovery

**Backup Recovery:**
```bash
# If backup_on_overwrite is enabled
ls -la frontend/public/stories/*.backup.*

# Restore from backup
cp story.html.backup.1634567890 story.html
```

**Decompile for Recovery:**
```bash
# Recover source from compiled HTML
./build-twine.sh decompile frontend/public/stories/story.html recovered-story
```

## Performance Tips

### Large Projects

- Use watch mode for development: `./build-twine.sh watch`
- Enable validation only for final builds
- Use parallel builds (Python script, future feature)
- Keep source files under 1MB for best performance

### Build Optimization

```json
{
  "validate_before_build": false,  // Skip validation for speed
  "show_statistics": false,       // Reduce output verbosity
  "backup_on_overwrite": false,   // Skip backup creation
  "log_level": "WARNING"          // Reduce logging
}
```

## Integration with NPM Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "twine:build": "./scripts/build-twine.sh build-all",
    "twine:watch": "./scripts/build-twine.sh watch",
    "twine:clean": "./scripts/build-twine.sh clean",
    "twine:list": "./scripts/build-twine.sh list",
    "twine:py": "python scripts/build_twine.py",
    "build": "npm run twine:build && npm run build:frontend"
  }
}
```

Usage:
```bash
npm run twine:build    # Build all stories
npm run twine:watch    # Watch mode
npm run twine:clean    # Clean compiled files
```

## Best Practices

### File Organization

```
twine-poc/
├── main-story.twee         # Primary story
├── side-quest.twee         # Additional content
├── shared/                 # Shared passages (future feature)
│   ├── common.twee
│   └── utilities.twee
└── archive/                # Backup/old versions
    └── old-story.twee
```

### Development Workflow

1. **Start** with watch mode: `./build-twine.sh watch`
2. **Edit** .twee files in your editor
3. **Test** in React app immediately (auto-recompiled)
4. **Validate** before committing: `python build_twine.py validate`
5. **Clean** build for production: `./build-twine.sh clean && ./build-twine.sh build-all`

### Version Control

```gitignore
# .gitignore
scripts/build.log
scripts/build_twine.log
*.backup.*
frontend/public/stories/*.html  # Optional: include compiled files or not
```

Include in version control:
- ✅ Source .twee files
- ✅ Build scripts
- ✅ Configuration files
- ❓ Compiled HTML files (project dependent)

### Code Quality

- Use consistent naming: `kebab-case.twee`
- Add metadata passages for documentation
- Include StoryInit for setup code
- Validate regularly during development
- Comment complex SugarCube code

## Advanced Usage

### Custom Configuration

Create environment-specific configs:

```bash
# Development
python build_twine.py --config dev-config.json build-all

# Production
python build_twine.py --config prod-config.json build-all
```

### Scripting and Automation

```bash
#!/bin/bash
# Automated build pipeline

set -e

echo "Building Twine stories..."
./scripts/build-twine.sh build-all

echo "Running validation..."
python scripts/build_twine.py validate

echo "Building React app..."
cd frontend && npm run build

echo "Build complete!"
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Build Twine Stories
  run: |
    source ~/.zshrc  # Load tweego
    ./scripts/build-twine.sh build-all
    python scripts/build_twine.py validate
```

## Contributing

When modifying the build scripts:

1. **Test** both shell and Python versions
2. **Update** documentation for new features
3. **Maintain** backward compatibility
4. **Follow** existing code style
5. **Add** examples for new functionality

## Support and Resources

- **Tweego Documentation**: http://www.motoslave.net/tweego/docs/
- **SugarCube Documentation**: https://www.motoslave.net/sugarcube/2/
- **Twine Documentation**: https://twinery.org/wiki/
- **Project Issues**: See main project repository

## Version History

- **1.0.0** - Initial release with shell and Python scripts
- Feature parity between both implementations
- Comprehensive documentation and examples
- Integration with React TwineStoryPlayer component

---

*For usage examples and common workflows, see [EXAMPLES.md](EXAMPLES.md)*