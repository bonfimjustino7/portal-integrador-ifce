local http = require("socket.http")

local internal_realm_url = os.getenv("KEYCLOAK_INTERNAL_REALM_URL") or "http://keycloak:8080/realms/university"
local public_issuer = os.getenv("KEYCLOAK_PUBLIC_ISSUER") or "http://localhost:8180/realms/university"
local template_path = os.getenv("KONG_TEMPLATE_PATH") or "/kong/templates/kong.template.yml"
local output_path = os.getenv("KONG_DECLARATIVE_CONFIG") or "/kong/generated/kong.yml"
local max_attempts = tonumber(os.getenv("KEYCLOAK_BOOTSTRAP_ATTEMPTS") or "60")

local function read_file(path)
  local file, err = io.open(path, "r")
  if not file then
    error("Unable to read " .. path .. ": " .. tostring(err))
  end

  local contents = file:read("*a")
  file:close()
  return contents
end

local function write_file(path, contents)
  local file, err = io.open(path, "w")
  if not file then
    error("Unable to write " .. path .. ": " .. tostring(err))
  end

  file:write(contents)
  file:close()
end

local function shell_quote(value)
  return "'" .. tostring(value):gsub("'", "'\\''") .. "'"
end

local function sleep(seconds)
  os.execute("sleep " .. shell_quote(seconds))
end

local function fetch_realm_metadata()
  local url = internal_realm_url

  for attempt = 1, max_attempts do
    local body, status = http.request(url)

    if status == 200 and body then
      return body
    end

    io.stderr:write(string.format(
      "Waiting for Keycloak metadata at %s (attempt %d/%d, status %s)\n",
      url,
      attempt,
      max_attempts,
      tostring(status)
    ))
    sleep(2)
  end

  error("Keycloak metadata did not become available at " .. url)
end

local function extract_public_key(metadata)
  local public_key = metadata:match('"public_key"%s*:%s*"([^"]+)"')

  if not public_key or public_key == "" then
    error("Unable to find public_key in Keycloak realm metadata")
  end

  return public_key
end

local function to_pem(public_key)
  local lines = { "-----BEGIN PUBLIC KEY-----" }

  for index = 1, #public_key, 64 do
    table.insert(lines, public_key:sub(index, index + 63))
  end

  table.insert(lines, "-----END PUBLIC KEY-----")
  return table.concat(lines, "\n")
end

local function indent(value, spaces)
  local prefix = string.rep(" ", spaces)
  return prefix .. value:gsub("\n", "\n" .. prefix)
end

local metadata = fetch_realm_metadata()
local public_key = extract_public_key(metadata)
local public_key_pem = to_pem(public_key)
local template = read_file(template_path)

local rendered = template
  :gsub("__KEYCLOAK_ISSUER__", public_issuer)
  :gsub("__KEYCLOAK_PUBLIC_KEY_PEM__", indent(public_key_pem, 10))

write_file(output_path, rendered)
print("Rendered Kong declarative config with Keycloak issuer " .. public_issuer)
