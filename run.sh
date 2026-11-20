#!/usr/bin/env bash
# Starts the deck at http://localhost:5080. Reads OPENROUTER_API_KEY from .env beside this file.
set -euo pipefail
cd "$(dirname "$0")"
# Works around a broken .NET workload set on some machines; harmless everywhere else.
export MSBuildEnableWorkloadResolver=false
exec dotnet run --project src/Jev.Demo "$@"
