#!/bin/bash

# =============================================================================
# Twine Story Build Script
# =============================================================================
#
# This script provides a comprehensive toolchain for building Twine stories
# using tweego. It supports compilation, decompilation, format conversion,
# and development workflow features.
#
# Requirements:
# - tweego (installed and in PATH)
# - Source files in twine-poc/ directory
# - Output to frontend/public/stories/ directory
#
# Author: Claude Code Assistant
# Version: 1.0.0
# =============================================================================

set -e  # Exit on any error

# Configuration variables
TWEE_SOURCE_DIR="twine-poc"
HTML_OUTPUT_DIR="frontend/public/stories"
DEFAULT_FORMAT="sugarcube-2"
WATCH_INTERVAL=2
LOG_FILE="scripts/build.log"
STYLESHEET_FILE="twine-poc/arcanum-stylesheet.twee"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if tweego is available
check_tweego() {
    if ! command -v tweego &> /dev/null; then
        print_error "tweego is not installed or not in PATH"
        print_info "Please install tweego and ensure it's in your PATH"
        print_info "You may need to run: source ~/.zshrc"
        exit 1
    fi
}

# Check if stylesheet file exists
check_stylesheet() {
    if [[ ! -f "$STYLESHEET_FILE" ]]; then
        print_warning "Arcanum stylesheet not found: $STYLESHEET_FILE"
        print_info "Stories will compile without Arcanum styling"
        return 1
    fi
    return 0
}

# Create output directory if it doesn't exist
ensure_output_dir() {
    if [[ ! -d "$HTML_OUTPUT_DIR" ]]; then
        print_info "Creating output directory: $HTML_OUTPUT_DIR"
        mkdir -p "$HTML_OUTPUT_DIR"
    fi
}

# Check if source directory exists
check_source_dir() {
    if [[ ! -d "$TWEE_SOURCE_DIR" ]]; then
        print_error "Source directory '$TWEE_SOURCE_DIR' not found"
        print_info "Please ensure you have .twee files in the $TWEE_SOURCE_DIR directory"
        exit 1
    fi
}

# Get list of .twee files
get_twee_files() {
    find "$TWEE_SOURCE_DIR" -name "*.twee" -type f
}

# Extract filename without extension
get_basename() {
    basename "$1" .twee
}

# =============================================================================
# Core Build Functions
# =============================================================================

# Build single .twee file to HTML
build_single() {
    local twee_file="$1"
    local output_name="$2"

    if [[ ! -f "$twee_file" ]]; then
        print_error "File not found: $twee_file"
        return 1
    fi

    local basename=$(get_basename "$twee_file")
    local output_file="$HTML_OUTPUT_DIR/${output_name:-$basename}.html"

    print_info "Compiling: $twee_file -> $output_file"
    log "Building $twee_file to $output_file"

    # Build command with optional stylesheet inclusion
    local build_cmd="tweego --format=\"$DEFAULT_FORMAT\" --output=\"$output_file\""
    local include_files=("$twee_file")

    # Add stylesheet if it exists
    if check_stylesheet; then
        include_files+=("$STYLESHEET_FILE")
        print_info "Including Arcanum stylesheet for consistent theming"
        log "Including stylesheet: $STYLESHEET_FILE"
    fi

    if tweego --format="$DEFAULT_FORMAT" --output="$output_file" "${include_files[@]}"; then
        print_success "Successfully compiled: $output_file"
        log "Successfully compiled $output_file"

        # Show file size
        local size=$(du -h "$output_file" | cut -f1)
        print_info "Output size: $size"

        return 0
    else
        print_error "Failed to compile: $twee_file"
        log "Failed to compile $twee_file"
        return 1
    fi
}

# Build all .twee files
build_all() {
    print_header "Building All Twine Stories"

    local twee_files=($(get_twee_files))
    local success_count=0
    local total_count=${#twee_files[@]}

    if [[ $total_count -eq 0 ]]; then
        print_warning "No .twee files found in $TWEE_SOURCE_DIR"
        return 1
    fi

    print_info "Found $total_count .twee files"

    for twee_file in "${twee_files[@]}"; do
        if build_single "$twee_file"; then
            ((success_count++))
        fi
        echo  # Add blank line for readability
    done

    print_header "Build Summary"
    print_info "Successfully compiled: $success_count/$total_count files"

    if [[ $success_count -eq $total_count ]]; then
        print_success "All files compiled successfully!"
        return 0
    else
        print_warning "Some files failed to compile"
        return 1
    fi
}

# Watch mode - auto-rebuild on file changes
watch_mode() {
    print_header "Starting Watch Mode"
    print_info "Watching for changes in $TWEE_SOURCE_DIR"
    print_info "Press Ctrl+C to stop"

    # Initial build
    build_all

    # Store initial modification times
    declare -A file_times
    local twee_files=($(get_twee_files))

    for file in "${twee_files[@]}"; do
        if [[ -f "$file" ]]; then
            file_times["$file"]=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)
        fi
    done

    print_info "Watching for file changes (checking every ${WATCH_INTERVAL}s)..."

    while true; do
        sleep $WATCH_INTERVAL

        # Check current files
        local current_files=($(get_twee_files))
        local changed=false

        # Check for new or modified files
        for file in "${current_files[@]}"; do
            if [[ -f "$file" ]]; then
                local current_time=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)

                if [[ -z "${file_times[$file]}" ]] || [[ "${file_times[$file]}" != "$current_time" ]]; then
                    print_info "Detected change in: $file"
                    log "File changed: $file"

                    if build_single "$file"; then
                        file_times["$file"]="$current_time"
                        changed=true
                    fi
                fi
            fi
        done

        # Check for deleted files
        for file in "${!file_times[@]}"; do
            if [[ ! -f "$file" ]]; then
                print_warning "File deleted: $file"
                log "File deleted: $file"
                unset file_times["$file"]
                changed=true
            fi
        done

        if [[ "$changed" == true ]]; then
            echo "---"
        fi
    done
}

# =============================================================================
# Decompilation and Conversion Functions
# =============================================================================

# Decompile HTML back to .twee format
decompile_html() {
    local html_file="$1"
    local output_name="$2"

    if [[ ! -f "$html_file" ]]; then
        print_error "HTML file not found: $html_file"
        return 1
    fi

    local basename=$(basename "$html_file" .html)
    local output_file="$TWEE_SOURCE_DIR/${output_name:-$basename}.twee"

    print_info "Decompiling: $html_file -> $output_file"
    log "Decompiling $html_file to $output_file"

    if tweego --decompile-twee3 --output="$output_file" "$html_file"; then
        print_success "Successfully decompiled: $output_file"
        log "Successfully decompiled $output_file"
        return 0
    else
        print_error "Failed to decompile: $html_file"
        log "Failed to decompile $html_file"
        return 1
    fi
}

# Import Twine archive to .twee format
import_archive() {
    local archive_file="$1"
    local output_name="$2"

    if [[ ! -f "$archive_file" ]]; then
        print_error "Archive file not found: $archive_file"
        return 1
    fi

    local basename=$(basename "$archive_file" | sed 's/\.[^.]*$//')
    local output_file="$TWEE_SOURCE_DIR/${output_name:-$basename}.twee"

    print_info "Importing archive: $archive_file -> $output_file"
    log "Importing archive $archive_file to $output_file"

    if tweego --decompile-twee3 --output="$output_file" "$archive_file"; then
        print_success "Successfully imported: $output_file"
        log "Successfully imported $output_file"
        return 0
    else
        print_error "Failed to import: $archive_file"
        log "Failed to import $archive_file"
        return 1
    fi
}

# Export .twee to Twine archive format
export_archive() {
    local twee_file="$1"
    local format="$2"
    local output_name="$3"

    if [[ ! -f "$twee_file" ]]; then
        print_error "Twee file not found: $twee_file"
        return 1
    fi

    local basename=$(get_basename "$twee_file")
    local extension

    case "$format" in
        "twine1"|"1")
            extension="tws"
            archive_flag="--archive-twine1"
            ;;
        "twine2"|"2"|*)
            extension="tw2"
            archive_flag="--archive-twine2"
            format="twine2"
            ;;
    esac

    local output_file="${output_name:-$basename}.$extension"

    print_info "Exporting to Twine $format archive: $twee_file -> $output_file"
    log "Exporting $twee_file to $format archive $output_file"

    if tweego $archive_flag --output="$output_file" "$twee_file"; then
        print_success "Successfully exported: $output_file"
        log "Successfully exported $output_file"
        return 0
    else
        print_error "Failed to export: $twee_file"
        log "Failed to export $twee_file"
        return 1
    fi
}

# =============================================================================
# Utility Commands
# =============================================================================

# Clean all compiled HTML files
clean() {
    print_header "Cleaning Compiled Files"

    if [[ -d "$HTML_OUTPUT_DIR" ]]; then
        local html_files=($(find "$HTML_OUTPUT_DIR" -name "*.html" -type f))
        local count=${#html_files[@]}

        if [[ $count -eq 0 ]]; then
            print_info "No HTML files to clean"
            return 0
        fi

        print_info "Found $count HTML files to remove"

        for file in "${html_files[@]}"; do
            print_info "Removing: $file"
            rm "$file"
        done

        print_success "Cleaned $count HTML files"
        log "Cleaned $count HTML files"
    else
        print_info "Output directory does not exist"
    fi
}

# List available .twee files and their compilation status
list_files() {
    print_header "Twine Story Files"

    local twee_files=($(get_twee_files))

    if [[ ${#twee_files[@]} -eq 0 ]]; then
        print_warning "No .twee files found in $TWEE_SOURCE_DIR"
        return 1
    fi

    print_info "Source files in $TWEE_SOURCE_DIR:"
    echo

    for twee_file in "${twee_files[@]}"; do
        local basename=$(get_basename "$twee_file")
        local html_file="$HTML_OUTPUT_DIR/$basename.html"
        local status

        if [[ -f "$html_file" ]]; then
            local twee_time=$(stat -f %m "$twee_file" 2>/dev/null || stat -c %Y "$twee_file" 2>/dev/null)
            local html_time=$(stat -f %m "$html_file" 2>/dev/null || stat -c %Y "$html_file" 2>/dev/null)

            if [[ $twee_time -gt $html_time ]]; then
                status="${YELLOW}OUT OF DATE${NC}"
            else
                status="${GREEN}COMPILED${NC}"
            fi
        else
            status="${RED}NOT COMPILED${NC}"
        fi

        printf "  %-30s -> %-30s [%s]\n" "$basename.twee" "$basename.html" "$status"
    done

    echo
    print_info "Output directory: $HTML_OUTPUT_DIR"
}

# Show version and configuration
show_version() {
    print_header "Twine Build Script Information"
    echo
    echo "Script Version: 1.1.0 (with Arcanum styling)"
    echo "Tweego Version: $(tweego --version | head -n1)"
    echo "Default Format: $DEFAULT_FORMAT"
    echo "Source Directory: $TWEE_SOURCE_DIR"
    echo "Output Directory: $HTML_OUTPUT_DIR"
    echo "Stylesheet File: $STYLESHEET_FILE"
    echo "Log File: $LOG_FILE"

    if check_stylesheet; then
        echo "Arcanum Styling: ✅ Available"
    else
        echo "Arcanum Styling: ❌ Not found"
    fi

    echo
}

# =============================================================================
# Help and Usage
# =============================================================================

show_help() {
    cat << 'EOF'
Twine Story Build Script

USAGE:
    ./build-twine.sh [COMMAND] [OPTIONS]

COMMANDS:
    build [file] [output]    Build single .twee file to HTML
                            - file: path to .twee file (required)
                            - output: output filename without .html (optional)

    build-all               Build all .twee files in twine-poc/

    watch                   Watch for file changes and auto-rebuild

    decompile [file] [out]  Decompile HTML back to .twee format
                            - file: path to .html file (required)
                            - out: output filename without .twee (optional)

    import [archive] [out]  Import Twine archive to .twee format
                            - archive: path to .tws or .tw2 file (required)
                            - out: output filename without .twee (optional)

    export [file] [fmt] [out] Export .twee to Twine archive format
                            - file: path to .twee file (required)
                            - fmt: twine1, twine2 (default: twine2)
                            - out: output filename without extension (optional)

    clean                   Remove all compiled HTML files

    list                    List all .twee files and compilation status

    version                 Show version and configuration information

    help                    Show this help message

EXAMPLES:
    # Build single story
    ./build-twine.sh build twine-poc/tarot-story.twee

    # Build all stories
    ./build-twine.sh build-all

    # Watch for changes
    ./build-twine.sh watch

    # Decompile HTML back to twee
    ./build-twine.sh decompile frontend/public/stories/story.html

    # Export to Twine 2 archive
    ./build-twine.sh export twine-poc/story.twee twine2 my-story

    # Clean compiled files
    ./build-twine.sh clean

CONFIGURATION:
    Edit the script variables at the top to customize:
    - TWEE_SOURCE_DIR: Source directory for .twee files
    - HTML_OUTPUT_DIR: Output directory for compiled HTML
    - DEFAULT_FORMAT: Default story format (sugarcube-2)
    - WATCH_INTERVAL: File watching interval in seconds
    - STYLESHEET_FILE: Arcanum design system stylesheet (auto-included)

REQUIREMENTS:
    - tweego must be installed and in PATH
    - Source .twee files in twine-poc/ directory
    - Write access to frontend/public/stories/ directory

For more information, see the README.md file in the scripts/ directory.
EOF
}

# =============================================================================
# Main Script Logic
# =============================================================================

# Initialize
main() {
    # Create log file if it doesn't exist
    touch "$LOG_FILE"

    # Check prerequisites
    check_tweego
    check_source_dir
    ensure_output_dir
    check_stylesheet  # Check for stylesheet (warnings only, not fatal)

    # Parse command
    local command="${1:-help}"

    case "$command" in
        "build")
            if [[ -z "$2" ]]; then
                print_error "Missing required argument: file"
                print_info "Usage: $0 build <file> [output_name]"
                exit 1
            fi
            build_single "$2" "$3"
            ;;
        "build-all"|"all")
            build_all
            ;;
        "watch")
            watch_mode
            ;;
        "decompile")
            if [[ -z "$2" ]]; then
                print_error "Missing required argument: file"
                print_info "Usage: $0 decompile <html_file> [output_name]"
                exit 1
            fi
            decompile_html "$2" "$3"
            ;;
        "import")
            if [[ -z "$2" ]]; then
                print_error "Missing required argument: archive_file"
                print_info "Usage: $0 import <archive_file> [output_name]"
                exit 1
            fi
            import_archive "$2" "$3"
            ;;
        "export")
            if [[ -z "$2" ]]; then
                print_error "Missing required argument: twee_file"
                print_info "Usage: $0 export <twee_file> [format] [output_name]"
                exit 1
            fi
            export_archive "$2" "${3:-twine2}" "$4"
            ;;
        "clean")
            clean
            ;;
        "list"|"ls")
            list_files
            ;;
        "version"|"--version"|"-v")
            show_version
            ;;
        "help"|"--help"|"-h"|*)
            show_help
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Build script interrupted${NC}"; exit 130' INT

# Run main function with all arguments
main "$@"