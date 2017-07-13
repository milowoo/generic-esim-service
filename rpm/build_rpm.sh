#!/bin/bash -ex
set -o pipefail

# Usage:
# Run this script in project root directory: `sh rpm/build_rpm.sh`
# Make sure environment variable http_proxy, https_proxy are set properly
export no_proxy="127.0.0.1,localhost"

# --- Initialize project environment
npm install --no-optional

# --- Build and test
npm run ci | ./node_modules/.bin/bunyan -l fatal

# --- Pack the release files to ./package
npm pack
rm -rf package
tar -zxf *.tgz
npm prune --production
mv node_modules package/

# --- Modify spec file
cp rpm/rpm.spec rpm/target.spec

timestamp=`date +%Y%m%d%H%M%S`
sed -i -e "s/__timestamp__/${timestamp}/" rpm/target.spec

commit=`git log -1 | sed -n '/^commit/p' | sed 's/commit //'`
sed -i -e "s/__commit__/${commit}/" rpm/target.spec

name=`grep '%define _name' rpm/target.spec | awk -F ' ' '{print $3}'`
version=`grep '%define version' rpm/target.spec | awk -F ' ' '{print $3}'`

# --- Build RPM
rpmbuild -ba rpm/target.spec

# --- Copy RPM to repo (available on CI server)
cp /var/tmp/x86_64/SES$name*.rpm /opt/msp3pp/
rm /var/tmp/x86_64/SES$name*.rpm
