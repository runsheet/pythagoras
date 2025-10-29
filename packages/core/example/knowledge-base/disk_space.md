# Disk Space Diagnostic Guidelines

To diagnose disk space issues on build agents:

1. Run `df -h` to view mounted volumes and usage.
2. Run `du -sh /opt/teamcity-agent/temp` to assess temp usage.
3. Clean temp directories: `/opt/teamcity-agent/temp/` and build caches older than 7 days.
4. Consider rotating logs in `/var/log` using `logrotate` config.
5. Verify large artifact directories and prune obsolete artifacts.
