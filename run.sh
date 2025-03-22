#!/bin/bash

# Determine script directory and navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to print colored output
print_color() {
    case "$1" in
        "red") printf "\033[91m%s\033[0m\n" "$2" ;;
        "green") printf "\033[92m%s\033[0m\n" "$2" ;;
        "yellow") printf "\033[93m%s\033[0m\n" "$2" ;;
        "blue") printf "\033[94m%s\033[0m\n" "$2" ;;
        *) printf "%s\n" "$2" ;;
    esac
}

# Function to print help information
show_help() {
    echo "Who What Where Portal Control Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  --init, -i              Initialize the database (creates tables and admin user)"
    echo "  --help, -h              Show this help message"
    echo ""
    echo "Options for --init:"
    echo "  --admin-username=NAME   Set custom admin username (default: admin)"
    echo "  --admin-email=EMAIL     Set custom admin email (default: admin@example.com)"
    echo ""
    echo "Examples:"
    echo "  $0                      Start the application normally"
    echo "  $0 --init               Initialize the database with default settings"
    echo "  $0 --init --admin-username=myadmin --admin-email=admin@mycompany.com"
    echo ""
    echo "Note: To load data, use the dedicated scripts:"
    echo "  python backend/load_data.py       # Load sample data"
    echo "  python backend/load_prod_data.py  # Load production data"
    echo ""
}

# Parse command line arguments
PRIMARY_COMMAND=""
ADMIN_USERNAME=""
ADMIN_EMAIL=""

# Process options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            show_help
            exit 0
            ;;
        --init|-i)
            PRIMARY_COMMAND="init"
            shift
            ;;
        --admin-username=*)
            ADMIN_USERNAME="${1#*=}"
            shift
            ;;
        --admin-email=*)
            ADMIN_EMAIL="${1#*=}"
            shift
            ;;
        *)
            print_color "red" "Unknown option: $1"
            print_color "yellow" "Use --help to see available options."
            exit 1
            ;;
    esac
done

# Execute the appropriate command
if [[ "$PRIMARY_COMMAND" == "init" ]]; then
    print_color "yellow" "Initializing database for Who What Where Portal..."
    
    # Build command with optional parameters
    COMMAND="python backend/main.py --force-initdb"
    
    if [[ -n "$ADMIN_USERNAME" ]]; then
        COMMAND="$COMMAND --admin-username=$ADMIN_USERNAME"
    fi
    
    if [[ -n "$ADMIN_EMAIL" ]]; then
        COMMAND="$COMMAND --admin-email=$ADMIN_EMAIL"
    fi
    
    # Execute initialization command
    print_color "yellow" "Running: $COMMAND"
    eval $COMMAND
    exit $?

else
    # If no specific command is given, start the backend service
    print_color "green" "Starting Who What Where Portal backend service..."
    cd backend
    python main.py
    exit $?
fi
