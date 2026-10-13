#!/bin/sh
set -eu

MAVEN_VERSION="3.9.9"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MAVEN_DIR="$SCRIPT_DIR/.mvn/apache-maven-$MAVEN_VERSION"

if [ ! -x "$MAVEN_DIR/bin/mvn" ]; then
  mkdir -p "$SCRIPT_DIR/.mvn"
  ARCHIVE=$(mktemp "${TMPDIR:-/tmp}/pulsegrid-maven.XXXXXX.tar.gz")
  trap 'rm -f "$ARCHIVE"' EXIT HUP INT TERM
  echo "Téléchargement de Maven $MAVEN_VERSION..."
  curl -fsSL "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.tar.gz" -o "$ARCHIVE"
  tar -xzf "$ARCHIVE" -C "$SCRIPT_DIR/.mvn"
  rm -f "$ARCHIVE"
  trap - EXIT HUP INT TERM
fi

exec "$MAVEN_DIR/bin/mvn" "$@"

