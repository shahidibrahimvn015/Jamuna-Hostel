-- Router/LAN configuration is now a fixed set of official IITM links embedded
-- directly in the WiFi/LAN page instead of admin-editable content, and the
-- complaint recipient is now the fixed helpdesk address. wifi_config is no
-- longer read or written anywhere in the app.
drop table if exists wifi_config;
