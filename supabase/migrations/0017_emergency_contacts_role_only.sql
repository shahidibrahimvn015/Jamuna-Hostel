-- Emergency contacts are a role and a number, not a person.
--
-- The form asked for Name (required), Role (optional) and Phone. In practice
-- what a resident needs in an emergency is "Security Desk" and a number, not
-- whoever happens to be on that desk tonight -- and a name that goes stale is
-- worse than no name. Role becomes the required label and name goes away.
--
-- Existing rows carry their useful label in `name`, often with role_title
-- empty, so that text is moved across before the column is dropped. Without
-- this backfill every current contact would render blank.

update emergency_contacts
   set role_title = name
 where role_title is null
    or btrim(role_title) = '';

-- Anything still empty would block the NOT NULL below; nothing should match,
-- but a contact with no label at all is not worth keeping.
delete from emergency_contacts
 where role_title is null or btrim(role_title) = '';

alter table emergency_contacts alter column role_title set not null;
alter table emergency_contacts drop column if exists name;
