# !/bin/bash

set -eu

#unzip artifacts ---> dist
# Check if artifacts.zip exists
if [ -f "artifacts.zip" ]; then
    echo "artifacts.zip found. Attempting to unzip..."
    # Attempt to unzip, but don't exit if it fails
    unzip artifacts.zip || {
        echo "Warning: Failed to unzip artifacts.zip. Continuing anyway..."
    }
else
    echo "Warning: artifacts.zip not found. Skipping unzip step..."
fi

#add kaniko authenticaion
cp $REGISTRY_AUTH /kaniko/.docker/config.json

#use kaniko to build image
/kaniko/executor  \
    --context $CI_PROJECT_DIR   \
    --dockerfile $CI_PROJECT_DIR/$DOCKERFILE    \
    --destination $REGISTRY:rabid-$CI_COMMIT_SHORT_SHA    
