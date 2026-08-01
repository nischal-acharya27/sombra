"""Static server for the game, with caching switched off.

Use this instead of `python3 -m http.server`.

`http.server` sends `Last-Modified` and no `Cache-Control`, so the browser falls
back to *heuristic freshness* — roughly a tenth of the file's age — and serves
stale ES modules and CSS without asking. That failure is invisible and
expensive: an edit appears to have had no effect, so you go and change something
that was never wrong. It has already cost this project two wrong diagnoses, and
it is the reason several verdicts in round 2 of `docs/PLAYTEST.md` disagree with
code that demonstrably changed.

    python3 tools/serve.py [port]      # default 8000

Serves the repository root regardless of the directory you run it from.
"""

import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # One line per request is noise; a failure is not.
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"SOMBRA — no-cache server on http://localhost:{port}")
    print(f"  root  {ROOT}")
    print(f"  suite http://localhost:{port}/?sim")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
