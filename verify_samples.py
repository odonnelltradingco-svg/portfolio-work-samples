"""Run the published sample tests using the selected Python interpreter."""
from pathlib import Path
import argparse
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--include-eda', action='store_true',
                        help='Also run the five Pandas analysis tests; install its requirements first.')
    parser.add_argument('--include-pdf', action='store_true',
                        help='Also run the ten CSV-to-PDF tests; install its requirements first.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    suites = [('csv-cleanup', 'test_clean_orders.py'),
              ('job-tracker', 'test_tracker.py'),
              ('site-repair', 'test_repair.py')]
    if args.include_eda:
        suites.append(('fulfillment-eda', 'test_analysis.py'))
    if args.include_pdf:
        suites.append(('csv-to-pdf', 'test_report_orders.py'))
    failed = []
    for folder, filename in suites:
        print(f'\nRunning {folder}', flush=True)
        result = subprocess.run([sys.executable, '-m', 'unittest', '-v', filename], cwd=root / folder)
        if result.returncode:
            failed.append(folder)
    if failed:
        print('\nFailed: ' + ', '.join(failed), file=sys.stderr)
        return 1
    print(f'\nAll {len(suites)} sample suites passed.')
    if not args.include_eda:
        print('EDA was not run. Use --include-eda after installing its requirements.')
    if not args.include_pdf:
        print('CSV-to-PDF was not run. Use --include-pdf after installing its requirements.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
