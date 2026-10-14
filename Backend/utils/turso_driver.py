# backend/utils/turso_driver.py
import json
import urllib.request
import os
from datetime import datetime, date

paramstyle = "qmark"
threadsafety = 1
apilevel = "2.0"

class TursoError(Exception):
    pass

class TursoCursor:
    def __init__(self, connection):
        self.connection = connection
        self.description = None
        self.lastrowid = None
        self.rowcount = -1
        self._rows = []
        self._index = 0

    def _convert_arg(self, arg):
        if arg is None:
            return {"type": "null"}
        elif isinstance(arg, bool):
            return {"type": "integer", "value": "1" if arg else "0"}
        elif isinstance(arg, int):
            return {"type": "integer", "value": str(arg)}
        elif isinstance(arg, float):
            return {"type": "float", "value": arg}
        elif isinstance(arg, (datetime, date)):
            return {"type": "text", "value": arg.isoformat()}
        elif isinstance(arg, (bytes, bytearray)):
            import base64
            return {"type": "blob", "base64": base64.b64encode(arg).decode("utf-8")}
        else:
            return {"type": "text", "value": str(arg)}

    def _parse_value(self, val_dict):
        if not isinstance(val_dict, dict):
            return val_dict
        vtype = val_dict.get("type")
        val = val_dict.get("value")
        if vtype == "null" or val is None:
            return None
        elif vtype == "integer":
            return int(val)
        elif vtype == "float":
            return float(val)
        elif vtype == "blob":
            import base64
            return base64.b64decode(val_dict.get("base64", ""))
        else:
            return str(val)

    def execute(self, sql, parameters=()):
        args = [self._convert_arg(p) for p in parameters] if parameters else []
        payload = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {
                        "sql": sql,
                        "args": args
                    }
                }
            ]
        }

        req = urllib.request.Request(
            self.connection.pipeline_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.connection.auth_token}",
                "Content-Type": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", [])
                if not results:
                    return self

                res = results[0]
                if res.get("type") == "error":
                    raise TursoError(res.get("error", {}).get("message", "Error en Turso"))

                response_obj = res.get("response", {}).get("result", {})
                cols = response_obj.get("cols", [])
                rows_raw = response_obj.get("rows", [])
                self.rowcount = response_obj.get("affected_row_count", len(rows_raw))

                last_id = response_obj.get("last_insert_rowid")
                if last_id is not None:
                    try:
                        self.lastrowid = int(last_id)
                    except:
                        self.lastrowid = last_id

                if cols:
                    self.description = [(c.get("name"), c.get("decltype"), None, None, None, None, None) for c in cols]
                else:
                    self.description = None

                self._rows = []
                for row in rows_raw:
                    parsed_row = tuple(self._parse_value(cell) for cell in row)
                    self._rows.append(parsed_row)

                self._index = 0
                return self

        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                raise TursoError(f"HTTP Error {e.code}: {err_body}")
            except:
                raise TursoError(f"HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            raise TursoError(f"Error en petición HTTP Turso: {e}")

    def fetchone(self):
        if self._index < len(self._rows):
            row = self._rows[self._index]
            self._index += 1
            return row
        return None

    def fetchall(self):
        remaining = self._rows[self._index:]
        self._index = len(self._rows)
        return remaining

    def fetchmany(self, size=None):
        if size is None:
            size = 1
        end = self._index + size
        batch = self._rows[self._index:end]
        self._index = end
        return batch

    def close(self):
        self._rows = []

class TursoConnection:
    def __init__(self, database_url, auth_token):
        clean_url = database_url.replace("libsql://", "https://").replace("sqlite://", "https://")
        if not clean_url.endswith("/v2/pipeline"):
            clean_url = clean_url.rstrip("/") + "/v2/pipeline"

        self.pipeline_url = clean_url
        self.auth_token = auth_token
        self.isolation_level = None

    def cursor(self):
        return TursoCursor(self)

    def create_function(self, name, num_args, func, *args, **kwargs):
        pass

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass

def connect(database_url, auth_token):
    return TursoConnection(database_url, auth_token)
