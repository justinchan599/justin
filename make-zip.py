import zipfile
import os

excludes = ['node_modules', '.next', '.git', 'weather-dashboard.zip',
            'weather-dashboard.tar.gz', 'weather-dashboard-linux.tar.gz',
            'create-zip.js', 'make-zip.py']

with zipfile.ZipFile('weather-dashboard-fixed.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in excludes]
        for f in files:
            if f not in excludes:
                filepath = os.path.join(root, f)
                # Use forward slashes for Linux compatibility
                arcname = filepath.replace('\\', '/').lstrip('./')
                zf.write(filepath, arcname)

print('Created weather-dashboard-fixed.zip')
print('Size:', os.path.getsize('weather-dashboard-fixed.zip'), 'bytes')
