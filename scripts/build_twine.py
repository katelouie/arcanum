#!/usr/bin/env python3
"""
Twine Story Build Script (Python Version)

This script provides a comprehensive toolchain for building Twine stories
using tweego. It offers enhanced features over the shell script including
JSON configuration, advanced validation, and better cross-platform support.

Requirements:
    - tweego (installed and in PATH)
    - Python 3.6+
    - Source files in twine-poc/ directory
    - Output to frontend/public/stories/ directory

Author: Claude Code Assistant
Version: 1.1.0 (with Arcanum styling)
"""

import argparse
import json
import logging
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import threading
import hashlib

# Configuration
DEFAULT_CONFIG = {
    "source_dir": "twine-poc",
    "output_dir": "frontend/public/stories",
    "format": "sugarcube-2",
    "watch_interval": 2,
    "log_level": "INFO",
    "auto_create_dirs": True,
    "backup_on_overwrite": False,
    "validate_before_build": True,
    "show_statistics": True,
    "stylesheet_file": "twine-poc/arcanum-stylesheet.twee",
    "compression": {
        "enabled": False,
        "level": 6
    }
}

CONFIG_FILE = "scripts/twine-config.json"
LOG_FILE = "scripts/build_twine.log"

class TwineBuilder:
    """Main class for building Twine stories with tweego."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the builder with configuration."""
        self.config = self._load_config(config_path)
        self._setup_logging()
        self.logger = logging.getLogger(__name__)
        self._file_hashes: Dict[str, str] = {}

    def _load_config(self, config_path: Optional[str] = None) -> Dict:
        """Load configuration from JSON file or create default."""
        config_path = config_path or CONFIG_FILE

        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                # Merge with defaults for any missing keys
                return {**DEFAULT_CONFIG, **config}
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Failed to load config from {config_path}: {e}")
                print("Using default configuration")

        return DEFAULT_CONFIG.copy()

    def _setup_logging(self):
        """Setup logging configuration."""
        log_level = getattr(logging, self.config.get("log_level", "INFO"))

        # Create logs directory if it doesn't exist
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler(sys.stdout) if log_level <= logging.INFO else logging.NullHandler()
            ]
        )

    def _check_tweego(self) -> bool:
        """Check if tweego is available in PATH."""
        try:
            result = subprocess.run(['tweego', '--version'],
                                  capture_output=True, text=True, check=True)
            self.logger.info(f"Found tweego: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("tweego is not installed or not in PATH")
            self.logger.info("Please install tweego and ensure it's in your PATH")
            self.logger.info("You may need to run: source ~/.zshrc")
            return False

    def _ensure_directories(self):
        """Create necessary directories if they don't exist."""
        source_dir = Path(self.config["source_dir"])
        output_dir = Path(self.config["output_dir"])

        if not source_dir.exists():
            if self.config["auto_create_dirs"]:
                source_dir.mkdir(parents=True, exist_ok=True)
                self.logger.info(f"Created source directory: {source_dir}")
            else:
                raise FileNotFoundError(f"Source directory not found: {source_dir}")

        if not output_dir.exists():
            if self.config["auto_create_dirs"]:
                output_dir.mkdir(parents=True, exist_ok=True)
                self.logger.info(f"Created output directory: {output_dir}")
            else:
                raise FileNotFoundError(f"Output directory not found: {output_dir}")

    def _get_twee_files(self) -> List[Path]:
        """Get list of .twee files in source directory."""
        source_dir = Path(self.config["source_dir"])
        return list(source_dir.glob("*.twee"))

    def _get_file_hash(self, file_path: Path) -> str:
        """Get SHA256 hash of file content."""
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()

    def _validate_twee_file(self, twee_file: Path) -> Tuple[bool, List[str]]:
        """Validate .twee file for common issues."""
        errors = []

        try:
            with open(twee_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Basic validation checks
            if not content.strip():
                errors.append("File is empty")

            # Check for required passages
            if ':: Start' not in content and ':: StoryInit' not in content:
                errors.append("No Start or StoryInit passage found")

            # Check for unclosed tags (basic check)
            open_tags = content.count('<<')
            close_tags = content.count('>>')
            if open_tags != close_tags:
                errors.append(f"Mismatched tags: {open_tags} open, {close_tags} close")

            # Check for common SugarCube syntax issues
            if '[[' in content and ']]' in content:
                open_links = content.count('[[')
                close_links = content.count(']]')
                if open_links != close_links:
                    errors.append(f"Mismatched links: {open_links} open, {close_links} close")

        except Exception as e:
            errors.append(f"Failed to read file: {e}")

        return len(errors) == 0, errors

    def build_single(self, twee_file: Path, output_name: Optional[str] = None) -> bool:
        """Build single .twee file to HTML."""
        if not twee_file.exists():
            self.logger.error(f"File not found: {twee_file}")
            return False

        # Validate file if enabled
        if self.config["validate_before_build"]:
            is_valid, errors = self._validate_twee_file(twee_file)
            if not is_valid:
                self.logger.error(f"Validation failed for {twee_file}:")
                for error in errors:
                    self.logger.error(f"  - {error}")
                return False

        # Determine output file
        output_name = output_name or twee_file.stem
        output_file = Path(self.config["output_dir"]) / f"{output_name}.html"

        # Backup if requested
        if self.config["backup_on_overwrite"] and output_file.exists():
            backup_file = output_file.with_suffix(f".html.backup.{int(time.time())}")
            shutil.copy2(output_file, backup_file)
            self.logger.info(f"Created backup: {backup_file}")

        self.logger.info(f"Compiling: {twee_file} -> {output_file}")

        try:
            # Build command with optional stylesheet inclusion
            cmd = [
                'tweego',
                '--format', self.config["format"],
                '--output', str(output_file)
            ]

            # Add source files
            include_files = [str(twee_file)]

            # Add stylesheet if it exists
            stylesheet_path = Path(self.config["stylesheet_file"])
            if stylesheet_path.exists():
                include_files.append(str(stylesheet_path))
                self.logger.info("Including Arcanum stylesheet for consistent theming")
            else:
                self.logger.warning(f"Arcanum stylesheet not found: {stylesheet_path}")
                self.logger.info("Story will compile without Arcanum styling")

            cmd.extend(include_files)

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Log warnings if any
            if result.stderr:
                self.logger.warning(f"Tweego warnings:\n{result.stderr}")

            self.logger.info(f"Successfully compiled: {output_file}")

            # Show statistics if enabled
            if self.config["show_statistics"]:
                file_size = output_file.stat().st_size
                self.logger.info(f"Output size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

            # Update file hash for change detection
            self._file_hashes[str(twee_file)] = self._get_file_hash(twee_file)

            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to compile {twee_file}:")
            self.logger.error(f"Exit code: {e.returncode}")
            if e.stdout:
                self.logger.error(f"stdout: {e.stdout}")
            if e.stderr:
                self.logger.error(f"stderr: {e.stderr}")
            return False

    def build_all(self) -> Tuple[int, int]:
        """Build all .twee files. Returns (success_count, total_count)."""
        self.logger.info("Building all Twine stories")

        twee_files = self._get_twee_files()
        total_count = len(twee_files)

        if total_count == 0:
            self.logger.warning(f"No .twee files found in {self.config['source_dir']}")
            return 0, 0

        self.logger.info(f"Found {total_count} .twee files")

        success_count = 0
        for twee_file in twee_files:
            if self.build_single(twee_file):
                success_count += 1

        self.logger.info(f"Build completed: {success_count}/{total_count} files successful")
        return success_count, total_count

    def watch_mode(self):
        """Watch for file changes and auto-rebuild."""
        self.logger.info("Starting watch mode")
        self.logger.info(f"Watching for changes in {self.config['source_dir']}")
        self.logger.info("Press Ctrl+C to stop")

        # Initial build
        self.build_all()

        # Initialize file hashes
        for twee_file in self._get_twee_files():
            self._file_hashes[str(twee_file)] = self._get_file_hash(twee_file)

        try:
            while True:
                time.sleep(self.config["watch_interval"])

                current_files = self._get_twee_files()
                changed_files = []

                # Check for changes in existing files
                for twee_file in current_files:
                    current_hash = self._get_file_hash(twee_file)
                    stored_hash = self._file_hashes.get(str(twee_file))

                    if stored_hash != current_hash:
                        changed_files.append(twee_file)
                        self.logger.info(f"Detected change in: {twee_file}")

                # Check for new files
                for twee_file in current_files:
                    if str(twee_file) not in self._file_hashes:
                        changed_files.append(twee_file)
                        self.logger.info(f"Detected new file: {twee_file}")

                # Check for deleted files
                for file_path in list(self._file_hashes.keys()):
                    if not Path(file_path).exists():
                        self.logger.info(f"File deleted: {file_path}")
                        del self._file_hashes[file_path]

                # Rebuild changed files
                if changed_files:
                    self.logger.info(f"Rebuilding {len(changed_files)} changed files")
                    for twee_file in changed_files:
                        self.build_single(twee_file)
                    self.logger.info("---")

        except KeyboardInterrupt:
            self.logger.info("Watch mode stopped")

    def decompile_html(self, html_file: Path, output_name: Optional[str] = None) -> bool:
        """Decompile HTML back to .twee format."""
        if not html_file.exists():
            self.logger.error(f"HTML file not found: {html_file}")
            return False

        output_name = output_name or html_file.stem
        output_file = Path(self.config["source_dir"]) / f"{output_name}.twee"

        self.logger.info(f"Decompiling: {html_file} -> {output_file}")

        try:
            cmd = [
                'tweego',
                '--decompile-twee3',
                '--output', str(output_file),
                str(html_file)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            if result.stderr:
                self.logger.warning(f"Tweego warnings:\n{result.stderr}")

            self.logger.info(f"Successfully decompiled: {output_file}")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to decompile {html_file}:")
            self.logger.error(f"Exit code: {e.returncode}")
            if e.stderr:
                self.logger.error(f"stderr: {e.stderr}")
            return False

    def import_archive(self, archive_file: Path, output_name: Optional[str] = None) -> bool:
        """Import Twine archive to .twee format."""
        if not archive_file.exists():
            self.logger.error(f"Archive file not found: {archive_file}")
            return False

        output_name = output_name or archive_file.stem
        output_file = Path(self.config["source_dir"]) / f"{output_name}.twee"

        self.logger.info(f"Importing archive: {archive_file} -> {output_file}")

        try:
            cmd = [
                'tweego',
                '--decompile-twee3',
                '--output', str(output_file),
                str(archive_file)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            if result.stderr:
                self.logger.warning(f"Tweego warnings:\n{result.stderr}")

            self.logger.info(f"Successfully imported: {output_file}")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to import {archive_file}:")
            self.logger.error(f"Exit code: {e.returncode}")
            if e.stderr:
                self.logger.error(f"stderr: {e.stderr}")
            return False

    def export_archive(self, twee_file: Path, format_type: str = "twine2",
                      output_name: Optional[str] = None) -> bool:
        """Export .twee to Twine archive format."""
        if not twee_file.exists():
            self.logger.error(f"Twee file not found: {twee_file}")
            return False

        # Determine output format and extension
        if format_type.lower() in ["twine1", "1"]:
            extension = "tws"
            archive_flag = "--archive-twine1"
            format_name = "Twine 1"
        else:
            extension = "tw2"
            archive_flag = "--archive-twine2"
            format_name = "Twine 2"

        output_name = output_name or twee_file.stem
        output_file = f"{output_name}.{extension}"

        self.logger.info(f"Exporting to {format_name} archive: {twee_file} -> {output_file}")

        try:
            cmd = [
                'tweego',
                archive_flag,
                '--output', output_file,
                str(twee_file)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            if result.stderr:
                self.logger.warning(f"Tweego warnings:\n{result.stderr}")

            self.logger.info(f"Successfully exported: {output_file}")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to export {twee_file}:")
            self.logger.error(f"Exit code: {e.returncode}")
            if e.stderr:
                self.logger.error(f"stderr: {e.stderr}")
            return False

    def clean(self) -> int:
        """Clean all compiled HTML files. Returns count of files removed."""
        output_dir = Path(self.config["output_dir"])

        if not output_dir.exists():
            self.logger.info("Output directory does not exist")
            return 0

        html_files = list(output_dir.glob("*.html"))
        count = len(html_files)

        if count == 0:
            self.logger.info("No HTML files to clean")
            return 0

        self.logger.info(f"Found {count} HTML files to remove")

        for html_file in html_files:
            self.logger.info(f"Removing: {html_file}")
            html_file.unlink()

        self.logger.info(f"Cleaned {count} HTML files")
        return count

    def list_files(self):
        """List available .twee files and their compilation status."""
        self.logger.info("Twine Story Files")

        twee_files = self._get_twee_files()
        output_dir = Path(self.config["output_dir"])

        if not twee_files:
            self.logger.warning(f"No .twee files found in {self.config['source_dir']}")
            return

        self.logger.info(f"Source files in {self.config['source_dir']}:")

        for twee_file in twee_files:
            html_file = output_dir / f"{twee_file.stem}.html"

            if html_file.exists():
                twee_time = twee_file.stat().st_mtime
                html_time = html_file.stat().st_mtime

                if twee_time > html_time:
                    status = "OUT OF DATE"
                else:
                    status = "COMPILED"
            else:
                status = "NOT COMPILED"

            print(f"  {twee_file.name:<30} -> {html_file.name:<30} [{status}]")

        print(f"\nOutput directory: {output_dir}")

    def validate_all(self):
        """Validate all .twee files."""
        self.logger.info("Validating all .twee files")

        twee_files = self._get_twee_files()
        if not twee_files:
            self.logger.warning(f"No .twee files found in {self.config['source_dir']}")
            return

        errors_found = False

        for twee_file in twee_files:
            is_valid, errors = self._validate_twee_file(twee_file)

            if is_valid:
                self.logger.info(f"✓ {twee_file.name}: Valid")
            else:
                self.logger.error(f"✗ {twee_file.name}: Validation failed")
                for error in errors:
                    self.logger.error(f"    - {error}")
                errors_found = True

        if not errors_found:
            self.logger.info("All files passed validation")
        else:
            self.logger.warning("Some files failed validation")

    def get_statistics(self):
        """Show build statistics."""
        self.logger.info("Build Statistics")

        source_dir = Path(self.config["source_dir"])
        output_dir = Path(self.config["output_dir"])

        # Count files
        twee_files = self._get_twee_files()
        html_files = list(output_dir.glob("*.html")) if output_dir.exists() else []

        print(f"Source Directory: {source_dir}")
        print(f"Output Directory: {output_dir}")
        print(f"Twee Files: {len(twee_files)}")
        print(f"HTML Files: {len(html_files)}")

        # Show file sizes
        if twee_files:
            total_twee_size = sum(f.stat().st_size for f in twee_files)
            print(f"Total Twee Size: {total_twee_size:,} bytes ({total_twee_size/1024:.1f} KB)")

        if html_files:
            total_html_size = sum(f.stat().st_size for f in html_files)
            print(f"Total HTML Size: {total_html_size:,} bytes ({total_html_size/1024:.1f} KB)")

        # Show configuration
        print(f"Story Format: {self.config['format']}")
        print(f"Watch Interval: {self.config['watch_interval']}s")
        print(f"Auto Create Dirs: {self.config['auto_create_dirs']}")
        print(f"Validate Before Build: {self.config['validate_before_build']}")

    def save_config(self, config_path: Optional[str] = None):
        """Save current configuration to file."""
        config_path = config_path or CONFIG_FILE

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(config_path), exist_ok=True)

        try:
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            self.logger.info(f"Configuration saved to: {config_path}")
        except IOError as e:
            self.logger.error(f"Failed to save configuration: {e}")


def main():
    """Main entry point with command-line interface."""
    parser = argparse.ArgumentParser(
        description="Twine Story Build Script (Python Version)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s build twine-poc/story.twee
  %(prog)s build-all
  %(prog)s watch
  %(prog)s decompile frontend/public/stories/story.html
  %(prog)s export twine-poc/story.twee twine2 my-story
  %(prog)s clean
        """
    )

    parser.add_argument(
        '--config', '-c',
        help='Path to configuration file (default: scripts/twine-config.json)'
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Build command
    build_parser = subparsers.add_parser('build', help='Build single .twee file')
    build_parser.add_argument('file', help='Path to .twee file')
    build_parser.add_argument('output', nargs='?', help='Output filename (without .html)')

    # Build-all command
    subparsers.add_parser('build-all', help='Build all .twee files')

    # Watch command
    subparsers.add_parser('watch', help='Watch for changes and auto-rebuild')

    # Decompile command
    decompile_parser = subparsers.add_parser('decompile', help='Decompile HTML to .twee')
    decompile_parser.add_argument('file', help='Path to HTML file')
    decompile_parser.add_argument('output', nargs='?', help='Output filename (without .twee)')

    # Import command
    import_parser = subparsers.add_parser('import', help='Import Twine archive to .twee')
    import_parser.add_argument('file', help='Path to archive file (.tws or .tw2)')
    import_parser.add_argument('output', nargs='?', help='Output filename (without .twee)')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export .twee to Twine archive')
    export_parser.add_argument('file', help='Path to .twee file')
    export_parser.add_argument('format', nargs='?', default='twine2',
                              choices=['twine1', '1', 'twine2', '2'],
                              help='Archive format (default: twine2)')
    export_parser.add_argument('output', nargs='?', help='Output filename (without extension)')

    # Other commands
    subparsers.add_parser('clean', help='Remove all compiled HTML files')
    subparsers.add_parser('list', help='List .twee files and compilation status')
    subparsers.add_parser('validate', help='Validate all .twee files')
    subparsers.add_parser('stats', help='Show build statistics')
    subparsers.add_parser('save-config', help='Save current configuration to file')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        # Initialize builder
        builder = TwineBuilder(args.config)

        # Check prerequisites
        if not builder._check_tweego():
            return 1

        builder._ensure_directories()

        # Execute command
        if args.command == 'build':
            success = builder.build_single(Path(args.file), args.output)
            return 0 if success else 1

        elif args.command == 'build-all':
            success_count, total_count = builder.build_all()
            return 0 if success_count == total_count else 1

        elif args.command == 'watch':
            builder.watch_mode()
            return 0

        elif args.command == 'decompile':
            success = builder.decompile_html(Path(args.file), args.output)
            return 0 if success else 1

        elif args.command == 'import':
            success = builder.import_archive(Path(args.file), args.output)
            return 0 if success else 1

        elif args.command == 'export':
            success = builder.export_archive(Path(args.file), args.format, args.output)
            return 0 if success else 1

        elif args.command == 'clean':
            count = builder.clean()
            return 0

        elif args.command == 'list':
            builder.list_files()
            return 0

        elif args.command == 'validate':
            builder.validate_all()
            return 0

        elif args.command == 'stats':
            builder.get_statistics()
            return 0

        elif args.command == 'save-config':
            builder.save_config()
            return 0

    except KeyboardInterrupt:
        print("\nOperation interrupted by user")
        return 130
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())