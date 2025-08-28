#!/bin/bash

# Firebase Firestore Deployment Script
# This script deploys Firestore security rules and indexes

set -e  # Exit on error

echo "========================================="
echo "🔥 Firebase Firestore Deployment Script"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed!"
    echo "Please install it using: npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if user is logged in to Firebase
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "You need to login to Firebase first."
    firebase login
fi

# Get the current project
CURRENT_PROJECT=$(firebase use 2>/dev/null | grep "Active Project:" | cut -d: -f2 | xargs)
if [ -z "$CURRENT_PROJECT" ]; then
    print_warning "No Firebase project selected."
    echo "Available projects:"
    firebase projects:list
    echo ""
    read -p "Enter project ID to use: " PROJECT_ID
    firebase use $PROJECT_ID
    CURRENT_PROJECT=$PROJECT_ID
fi

print_success "Using Firebase project: $CURRENT_PROJECT"
echo ""

# Function to deploy rules
deploy_rules() {
    echo "📜 Deploying Firestore Security Rules..."
    echo "----------------------------------------"
    
    if [ -f "firebase/firestore.rules" ]; then
        # Test rules first
        echo "Testing rules syntax..."
        if firebase emulators:exec --only firestore "echo 'Rules syntax OK'" 2>/dev/null; then
            print_success "Rules syntax is valid"
        else
            print_warning "Could not test rules with emulator"
        fi
        
        # Deploy rules
        if firebase deploy --only firestore:rules; then
            print_success "Firestore rules deployed successfully!"
        else
            print_error "Failed to deploy Firestore rules"
            return 1
        fi
    else
        print_error "firestore.rules file not found!"
        return 1
    fi
    echo ""
}

# Function to deploy indexes
deploy_indexes() {
    echo "🔍 Deploying Firestore Indexes..."
    echo "----------------------------------------"
    
    if [ -f "firebase/firestore.indexes.json" ]; then
        # Deploy indexes
        if firebase deploy --only firestore:indexes; then
            print_success "Firestore indexes deployed successfully!"
            echo ""
            print_warning "Note: Index building may take several minutes to complete."
            echo "You can check the status in the Firebase Console:"
            echo "https://console.firebase.google.com/project/$CURRENT_PROJECT/firestore/indexes"
        else
            print_error "Failed to deploy Firestore indexes"
            return 1
        fi
    else
        print_error "firestore.indexes.json file not found!"
        return 1
    fi
    echo ""
}

# Function to backup current rules
backup_rules() {
    echo "💾 Backing up current rules..."
    BACKUP_DIR="firebase/backups"
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    if [ -f "firebase/firestore.rules" ]; then
        cp firebase/firestore.rules "$BACKUP_DIR/firestore.rules.$TIMESTAMP"
        print_success "Rules backed up to $BACKUP_DIR/firestore.rules.$TIMESTAMP"
    fi
    
    if [ -f "firebase/firestore.indexes.json" ]; then
        cp firebase/firestore.indexes.json "$BACKUP_DIR/firestore.indexes.$TIMESTAMP.json"
        print_success "Indexes backed up to $BACKUP_DIR/firestore.indexes.$TIMESTAMP.json"
    fi
    echo ""
}

# Function to validate environment
validate_environment() {
    echo "🔍 Validating environment..."
    echo "----------------------------------------"
    
    # Check Node version for Firebase functions
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -eq "22" ]; then
        print_success "Node version 22 detected (compatible with Firebase Functions)"
    else
        print_warning "Node version is not 22. Firebase Functions require Node 22"
    fi
    
    # Check if emulators are configured
    if grep -q "emulators" firebase.json; then
        print_success "Firebase emulators are configured"
    else
        print_warning "Firebase emulators are not configured. Consider setting them up for local testing."
    fi
    
    echo ""
}

# Main deployment menu
show_menu() {
    echo "What would you like to deploy?"
    echo "-------------------------------"
    echo "1) Security Rules only"
    echo "2) Indexes only"
    echo "3) Both Rules and Indexes"
    echo "4) Backup current configuration"
    echo "5) Validate environment"
    echo "6) Deploy everything (Rules, Indexes, Functions)"
    echo "7) Exit"
    echo ""
}

# Main script
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice
        echo ""
        
        case $choice in
            1)
                backup_rules
                deploy_rules
                ;;
            2)
                backup_rules
                deploy_indexes
                ;;
            3)
                backup_rules
                deploy_rules
                deploy_indexes
                ;;
            4)
                backup_rules
                ;;
            5)
                validate_environment
                ;;
            6)
                backup_rules
                deploy_rules
                deploy_indexes
                echo "📦 Deploying Cloud Functions..."
                firebase deploy --only functions
                print_success "All components deployed!"
                ;;
            7)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter a number between 1 and 7."
                ;;
        esac
        
        echo ""
        echo "========================================="
        echo ""
    done
}

# Run main function
main