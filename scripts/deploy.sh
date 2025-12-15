# !/bin/bash

set -eu

git config --global user.name $APP_NAME
git config --global user.email $APP_NAME"@var-meta.com"
git clone --single-branch --branch $CD_BRANCH $CD_GIT_REPOSITORY
cd $CD_CHART_REPO
# HELM Update
tag=$(grep "tag:" $VALUE_FILE | awk '{print $2}')
sed -i "s/$tag/rabid-$CI_COMMIT_SHORT_SHA/" $VALUE_FILE
git commit -am "🔥 update $APP_NAME image tag" && git push origin main
