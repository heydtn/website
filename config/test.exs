import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :website, WebsiteWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "TifkSNxpJMXofxiiCT0bPVCT3NSi6kp0OYuaI3XU//5GXz2demiYZetiF4haDA+9",
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
