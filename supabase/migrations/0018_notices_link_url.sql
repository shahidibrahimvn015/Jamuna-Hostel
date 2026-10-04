-- Optional link on a notice: a form to fill in, a registration page, a
-- results sheet. Shown as an "Open" button on the notice card.
--
-- Nullable with no default: most notices are just an announcement, and a
-- notice without a link should render without the button rather than with a
-- dead one.
alter table notices add column if not exists link_url text;
