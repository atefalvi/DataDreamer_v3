--
-- PostgreSQL database dump
--

-- Dumped from database version 13.8 (Debian 13.8-1.pgdg110+1)
-- Dumped by pg_dump version 13.8 (Debian 13.8-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: directus
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO directus;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: directus
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO directus;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: directus
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO directus;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: directus
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: about; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.about (
    id integer NOT NULL,
    hero_tagline character varying(255),
    hero_title character varying(255),
    hero_description text,
    profile_image uuid,
    stats json,
    experience json,
    skills json,
    resume uuid
);


ALTER TABLE public.about OWNER TO directus;

--
-- Name: about_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.about_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.about_id_seq OWNER TO directus;

--
-- Name: about_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.about_id_seq OWNED BY public.about.id;


--
-- Name: directus_access; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_access (
    id uuid NOT NULL,
    role uuid,
    "user" uuid,
    policy uuid NOT NULL,
    sort integer
);


ALTER TABLE public.directus_access OWNER TO directus;

--
-- Name: directus_activity; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_activity (
    id integer NOT NULL,
    action character varying(45) NOT NULL,
    "user" uuid,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip character varying(50),
    user_agent text,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    origin character varying(255)
);


ALTER TABLE public.directus_activity OWNER TO directus;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_activity_id_seq OWNER TO directus;

--
-- Name: directus_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_activity_id_seq OWNED BY public.directus_activity.id;


--
-- Name: directus_collections; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_collections (
    collection character varying(64) NOT NULL,
    icon character varying(64),
    note text,
    display_template character varying(255),
    hidden boolean DEFAULT false NOT NULL,
    singleton boolean DEFAULT false NOT NULL,
    translations json,
    archive_field character varying(64),
    archive_app_filter boolean DEFAULT true NOT NULL,
    archive_value character varying(255),
    unarchive_value character varying(255),
    sort_field character varying(64),
    accountability character varying(255) DEFAULT 'all'::character varying,
    color character varying(255),
    item_duplication_fields json,
    sort integer,
    "group" character varying(64),
    collapse character varying(255) DEFAULT 'open'::character varying NOT NULL,
    preview_url character varying(255),
    versioning boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_collections OWNER TO directus;

--
-- Name: directus_comments; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_comments (
    id uuid NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    comment text NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid
);


ALTER TABLE public.directus_comments OWNER TO directus;

--
-- Name: directus_dashboards; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_dashboards (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64) DEFAULT 'dashboard'::character varying NOT NULL,
    note text,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    color character varying(255)
);


ALTER TABLE public.directus_dashboards OWNER TO directus;

--
-- Name: directus_deployment_projects; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_deployment_projects (
    id uuid NOT NULL,
    deployment uuid NOT NULL,
    external_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    url character varying(255),
    framework character varying(255),
    deployable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.directus_deployment_projects OWNER TO directus;

--
-- Name: directus_deployment_runs; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_deployment_runs (
    id uuid NOT NULL,
    project uuid NOT NULL,
    external_id character varying(255) NOT NULL,
    target character varying(255) NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    status character varying(255),
    url character varying(255),
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE public.directus_deployment_runs OWNER TO directus;

--
-- Name: directus_deployments; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_deployments (
    id uuid NOT NULL,
    provider character varying(255) NOT NULL,
    credentials text,
    options text,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    webhook_ids json,
    webhook_secret character varying(255),
    last_synced_at timestamp with time zone
);


ALTER TABLE public.directus_deployments OWNER TO directus;

--
-- Name: directus_extensions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_extensions (
    enabled boolean DEFAULT true NOT NULL,
    id uuid NOT NULL,
    folder character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    bundle uuid
);


ALTER TABLE public.directus_extensions OWNER TO directus;

--
-- Name: directus_fields; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_fields (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    field character varying(64) NOT NULL,
    special character varying(64),
    interface character varying(64),
    options json,
    display character varying(64),
    display_options json,
    readonly boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    sort integer,
    width character varying(30) DEFAULT 'full'::character varying,
    translations json,
    note text,
    conditions json,
    required boolean DEFAULT false,
    "group" character varying(64),
    validation json,
    validation_message text,
    searchable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.directus_fields OWNER TO directus;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_fields_id_seq OWNER TO directus;

--
-- Name: directus_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_fields_id_seq OWNED BY public.directus_fields.id;


--
-- Name: directus_files; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_files (
    id uuid NOT NULL,
    storage character varying(255) NOT NULL,
    filename_disk character varying(255),
    filename_download character varying(255) NOT NULL,
    title character varying(255),
    type character varying(255),
    folder uuid,
    uploaded_by uuid,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_by uuid,
    modified_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    charset character varying(50),
    filesize bigint,
    width integer,
    height integer,
    duration integer,
    embed character varying(200),
    description text,
    location text,
    tags text,
    metadata json,
    focal_point_x integer,
    focal_point_y integer,
    tus_id character varying(64),
    tus_data json,
    uploaded_on timestamp with time zone
);


ALTER TABLE public.directus_files OWNER TO directus;

--
-- Name: directus_flows; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_flows (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    icon character varying(64),
    color character varying(255),
    description text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    trigger character varying(255),
    accountability character varying(255) DEFAULT 'all'::character varying,
    options json,
    operation uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_flows OWNER TO directus;

--
-- Name: directus_folders; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_folders (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    parent uuid
);


ALTER TABLE public.directus_folders OWNER TO directus;

--
-- Name: directus_migrations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_migrations (
    version character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.directus_migrations OWNER TO directus;

--
-- Name: directus_notifications; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_notifications (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(255) DEFAULT 'inbox'::character varying,
    recipient uuid NOT NULL,
    sender uuid,
    subject character varying(255) NOT NULL,
    message text,
    collection character varying(64),
    item character varying(255)
);


ALTER TABLE public.directus_notifications OWNER TO directus;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_notifications_id_seq OWNER TO directus;

--
-- Name: directus_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_notifications_id_seq OWNED BY public.directus_notifications.id;


--
-- Name: directus_operations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_operations (
    id uuid NOT NULL,
    name character varying(255),
    key character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    options json,
    resolve uuid,
    reject uuid,
    flow uuid NOT NULL,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_operations OWNER TO directus;

--
-- Name: directus_panels; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_panels (
    id uuid NOT NULL,
    dashboard uuid NOT NULL,
    name character varying(255),
    icon character varying(64) DEFAULT NULL::character varying,
    color character varying(10),
    show_header boolean DEFAULT false NOT NULL,
    note text,
    type character varying(255) NOT NULL,
    position_x integer NOT NULL,
    position_y integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    options json,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid
);


ALTER TABLE public.directus_panels OWNER TO directus;

--
-- Name: directus_permissions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_permissions (
    id integer NOT NULL,
    collection character varying(64) NOT NULL,
    action character varying(10) NOT NULL,
    permissions json,
    validation json,
    presets json,
    fields text,
    policy uuid NOT NULL
);


ALTER TABLE public.directus_permissions OWNER TO directus;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_permissions_id_seq OWNER TO directus;

--
-- Name: directus_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_permissions_id_seq OWNED BY public.directus_permissions.id;


--
-- Name: directus_policies; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_policies (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'badge'::character varying NOT NULL,
    description text,
    ip_access text,
    enforce_tfa boolean DEFAULT false NOT NULL,
    admin_access boolean DEFAULT false NOT NULL,
    app_access boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_policies OWNER TO directus;

--
-- Name: directus_presets; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_presets (
    id integer NOT NULL,
    bookmark character varying(255),
    "user" uuid,
    role uuid,
    collection character varying(64),
    search character varying(100),
    layout character varying(100) DEFAULT 'tabular'::character varying,
    layout_query json,
    layout_options json,
    refresh_interval integer,
    filter json,
    icon character varying(64) DEFAULT 'bookmark'::character varying,
    color character varying(255)
);


ALTER TABLE public.directus_presets OWNER TO directus;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_presets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_presets_id_seq OWNER TO directus;

--
-- Name: directus_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_presets_id_seq OWNED BY public.directus_presets.id;


--
-- Name: directus_relations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_relations (
    id integer NOT NULL,
    many_collection character varying(64) NOT NULL,
    many_field character varying(64) NOT NULL,
    one_collection character varying(64),
    one_field character varying(64),
    one_collection_field character varying(64),
    one_allowed_collections text,
    junction_field character varying(64),
    sort_field character varying(64),
    one_deselect_action character varying(255) DEFAULT 'nullify'::character varying NOT NULL
);


ALTER TABLE public.directus_relations OWNER TO directus;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_relations_id_seq OWNER TO directus;

--
-- Name: directus_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_relations_id_seq OWNED BY public.directus_relations.id;


--
-- Name: directus_revisions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_revisions (
    id integer NOT NULL,
    activity integer NOT NULL,
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    data json,
    delta json,
    parent integer,
    version uuid
);


ALTER TABLE public.directus_revisions OWNER TO directus;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_revisions_id_seq OWNER TO directus;

--
-- Name: directus_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_revisions_id_seq OWNED BY public.directus_revisions.id;


--
-- Name: directus_roles; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_roles (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(64) DEFAULT 'supervised_user_circle'::character varying NOT NULL,
    description text,
    parent uuid
);


ALTER TABLE public.directus_roles OWNER TO directus;

--
-- Name: directus_sessions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_sessions (
    token character varying(64) NOT NULL,
    "user" uuid,
    expires timestamp with time zone NOT NULL,
    ip character varying(255),
    user_agent text,
    share uuid,
    origin character varying(255),
    next_token character varying(64)
);


ALTER TABLE public.directus_sessions OWNER TO directus;

--
-- Name: directus_settings; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_settings (
    id integer NOT NULL,
    project_name character varying(100) DEFAULT 'Directus'::character varying NOT NULL,
    project_url character varying(255),
    project_color character varying(255) DEFAULT '#6644FF'::character varying NOT NULL,
    project_logo uuid,
    public_foreground uuid,
    public_background uuid,
    public_note text,
    auth_login_attempts integer DEFAULT 25,
    auth_password_policy character varying(100),
    storage_asset_transform character varying(7) DEFAULT 'all'::character varying,
    storage_asset_presets json,
    custom_css text,
    storage_default_folder uuid,
    basemaps json,
    mapbox_key character varying(255),
    module_bar json,
    project_descriptor character varying(100),
    default_language character varying(255) DEFAULT 'en-US'::character varying NOT NULL,
    custom_aspect_ratios json,
    public_favicon uuid,
    default_appearance character varying(255) DEFAULT 'auto'::character varying NOT NULL,
    default_theme_light character varying(255),
    theme_light_overrides json,
    default_theme_dark character varying(255),
    theme_dark_overrides json,
    report_error_url character varying(255),
    report_bug_url character varying(255),
    report_feature_url character varying(255),
    public_registration boolean DEFAULT false NOT NULL,
    public_registration_verify_email boolean DEFAULT true NOT NULL,
    public_registration_role uuid,
    public_registration_email_filter json,
    visual_editor_urls json,
    project_id uuid,
    mcp_enabled boolean DEFAULT false NOT NULL,
    mcp_allow_deletes boolean DEFAULT false NOT NULL,
    mcp_prompts_collection character varying(255) DEFAULT NULL::character varying,
    mcp_system_prompt_enabled boolean DEFAULT true NOT NULL,
    mcp_system_prompt text,
    project_owner character varying(255),
    project_usage character varying(255),
    org_name character varying(255),
    product_updates boolean,
    project_status character varying(255),
    ai_openai_api_key text,
    ai_anthropic_api_key text,
    ai_system_prompt text,
    ai_google_api_key text,
    ai_openai_compatible_api_key text,
    ai_openai_compatible_base_url text,
    ai_openai_compatible_name text,
    ai_openai_compatible_models json,
    ai_openai_compatible_headers json,
    ai_openai_allowed_models json,
    ai_anthropic_allowed_models json,
    ai_google_allowed_models json,
    collaborative_editing_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.directus_settings OWNER TO directus;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.directus_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.directus_settings_id_seq OWNER TO directus;

--
-- Name: directus_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.directus_settings_id_seq OWNED BY public.directus_settings.id;


--
-- Name: directus_shares; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_shares (
    id uuid NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    role uuid,
    password character varying(255),
    user_created uuid,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_start timestamp with time zone,
    date_end timestamp with time zone,
    times_used integer DEFAULT 0,
    max_uses integer
);


ALTER TABLE public.directus_shares OWNER TO directus;

--
-- Name: directus_translations; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_translations (
    id uuid NOT NULL,
    language character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.directus_translations OWNER TO directus;

--
-- Name: directus_users; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_users (
    id uuid NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(128),
    password character varying(255),
    location character varying(255),
    title character varying(50),
    description text,
    tags json,
    avatar uuid,
    language character varying(255) DEFAULT NULL::character varying,
    tfa_secret character varying(255),
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    role uuid,
    token character varying(255),
    last_access timestamp with time zone,
    last_page character varying(255),
    provider character varying(128) DEFAULT 'default'::character varying NOT NULL,
    external_identifier character varying(255),
    auth_data json,
    email_notifications boolean DEFAULT true,
    appearance character varying(255),
    theme_dark character varying(255),
    theme_light character varying(255),
    theme_light_overrides json,
    theme_dark_overrides json,
    text_direction character varying(255) DEFAULT 'auto'::character varying NOT NULL
);


ALTER TABLE public.directus_users OWNER TO directus;

--
-- Name: directus_versions; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.directus_versions (
    id uuid NOT NULL,
    key character varying(64) NOT NULL,
    name character varying(255),
    collection character varying(64) NOT NULL,
    item character varying(255) NOT NULL,
    hash character varying(255),
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_created uuid,
    user_updated uuid,
    delta json
);


ALTER TABLE public.directus_versions OWNER TO directus;

--
-- Name: home_settings; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.home_settings (
    id integer NOT NULL,
    hero_tagline_1 character varying(255),
    hero_tagline_2 character varying(255),
    hero_tagline_3 character varying(255)
);


ALTER TABLE public.home_settings OWNER TO directus;

--
-- Name: home_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.home_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.home_settings_id_seq OWNER TO directus;

--
-- Name: home_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.home_settings_id_seq OWNED BY public.home_settings.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    title character varying(255),
    slug character varying(255),
    excerpt character varying(255),
    content text,
    published_at timestamp with time zone,
    tag character varying(255),
    category character varying(255),
    log_number integer,
    series_label character varying(255)
);


ALTER TABLE public.logs OWNER TO directus;

--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.logs_id_seq OWNER TO directus;

--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title character varying(255),
    slug character varying(255),
    summary character varying(255),
    description text,
    cover_image uuid,
    tags json,
    published_at timestamp with time zone,
    featured boolean
);


ALTER TABLE public.projects OWNER TO directus;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO directus;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: directus
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    status_text character varying(255),
    email character varying(255),
    github character varying(255),
    linkedin character varying(255),
    footer_cta_heading character varying(255),
    twitter character varying(255)
);


ALTER TABLE public.site_settings OWNER TO directus;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: directus
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.site_settings_id_seq OWNER TO directus;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: directus
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: about id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.about ALTER COLUMN id SET DEFAULT nextval('public.about_id_seq'::regclass);


--
-- Name: directus_activity id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_activity ALTER COLUMN id SET DEFAULT nextval('public.directus_activity_id_seq'::regclass);


--
-- Name: directus_fields id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_fields ALTER COLUMN id SET DEFAULT nextval('public.directus_fields_id_seq'::regclass);


--
-- Name: directus_notifications id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications ALTER COLUMN id SET DEFAULT nextval('public.directus_notifications_id_seq'::regclass);


--
-- Name: directus_permissions id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions ALTER COLUMN id SET DEFAULT nextval('public.directus_permissions_id_seq'::regclass);


--
-- Name: directus_presets id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets ALTER COLUMN id SET DEFAULT nextval('public.directus_presets_id_seq'::regclass);


--
-- Name: directus_relations id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_relations ALTER COLUMN id SET DEFAULT nextval('public.directus_relations_id_seq'::regclass);


--
-- Name: directus_revisions id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions ALTER COLUMN id SET DEFAULT nextval('public.directus_revisions_id_seq'::regclass);


--
-- Name: directus_settings id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings ALTER COLUMN id SET DEFAULT nextval('public.directus_settings_id_seq'::regclass);


--
-- Name: home_settings id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.home_settings ALTER COLUMN id SET DEFAULT nextval('public.home_settings_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Data for Name: about; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.about (id, hero_tagline, hero_title, hero_description, profile_image, stats, experience, skills, resume) FROM stdin;
1	// IDENTIFICATION: AI ENGINEER	Atef Alvi	I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.	8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d	[{"number":"08+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}]	[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}]	[{"header":"01 / INTELLIGENCE","name":"AI","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}]	30e08566-6207-4e96-bcfb-8516d883eedc
\.


--
-- Data for Name: directus_access; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_access (id, role, "user", policy, sort) FROM stdin;
993bc661-6dcf-49d0-b52b-2857252bc1b8	\N	\N	abf8a154-5b1c-4a46-ac9c-7300570f4f17	1
efceb279-a01c-412f-893a-8f3beb4c9aa8	468a5eff-ce7f-4ecf-848f-f1ae8c549d20	\N	1dc3ec5f-0fb5-4fa5-ae5b-75d5529ea868	\N
a75e11ac-612f-40ee-a843-f91b7434b057	1a517210-06bd-4ba9-b549-491374a650f3	\N	4ec5e347-7def-4052-808c-5f68c946fd38	\N
57c4f254-3b51-4f2e-81c2-1ec7fb35fa15	1a517210-06bd-4ba9-b549-491374a650f3	\N	4ec5e347-7def-4052-808c-5f68c946fd38	1
\.


--
-- Data for Name: directus_activity; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_activity (id, action, "user", "timestamp", ip, user_agent, collection, item, origin) FROM stdin;
1	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-05 20:16:52.584+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	http://localhost:8055
2	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-05 20:17:17.236+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_settings	1	http://localhost:8055
3	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:08:41.663+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_files	21370c33-bbf1-4436-b2ed-b9e9d70b936a	http://localhost:8055
4	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:09:01.732+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_settings	1	http://localhost:8055
5	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:09:31.809+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_files	dd95fd0e-9f91-44ad-9c74-bd5ca47998ac	http://localhost:8055
6	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:09:35.54+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_settings	1	http://localhost:8055
7	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:09:43.788+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	directus_settings	1	http://localhost:8055
8	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:31:41.126+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	http://localhost:8055
9	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:35:33.535+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
10	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.173+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
11	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.679+00	172.18.0.1	node	directus_fields	1	\N
12	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.687+00	172.18.0.1	node	directus_collections	projects	\N
13	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.759+00	172.18.0.1	node	directus_fields	2	\N
14	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.802+00	172.18.0.1	node	directus_fields	3	\N
15	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.838+00	172.18.0.1	node	directus_fields	4	\N
16	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.873+00	172.18.0.1	node	directus_fields	5	\N
17	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.909+00	172.18.0.1	node	directus_fields	6	\N
18	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.947+00	172.18.0.1	node	directus_fields	7	\N
19	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:28.994+00	172.18.0.1	node	directus_fields	8	\N
20	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.033+00	172.18.0.1	node	directus_fields	9	\N
21	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.072+00	172.18.0.1	node	directus_fields	10	\N
22	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.073+00	172.18.0.1	node	directus_collections	logs	\N
23	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.101+00	172.18.0.1	node	directus_fields	11	\N
24	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.139+00	172.18.0.1	node	directus_fields	12	\N
25	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.172+00	172.18.0.1	node	directus_fields	13	\N
26	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.207+00	172.18.0.1	node	directus_fields	14	\N
27	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.242+00	172.18.0.1	node	directus_fields	15	\N
28	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.274+00	172.18.0.1	node	directus_fields	16	\N
29	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.308+00	172.18.0.1	node	directus_fields	17	\N
30	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.344+00	172.18.0.1	node	directus_fields	18	\N
31	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.375+00	172.18.0.1	node	directus_fields	19	\N
32	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.411+00	172.18.0.1	node	directus_fields	20	\N
33	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.414+00	172.18.0.1	node	directus_collections	site_settings	\N
34	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.604+00	172.18.0.1	node	directus_fields	21	\N
35	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.605+00	172.18.0.1	node	directus_collections	home_settings	\N
36	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.723+00	172.18.0.1	node	projects	1	\N
37	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:43:29.73+00	172.18.0.1	node	logs	1	\N
38	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:49:58.721+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_fields	14	http://localhost:8055
39	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:51:46.031+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
40	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:52:51.544+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
41	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:53:14.678+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
42	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:53:30.824+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
43	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:04.246+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
44	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:05.381+00	172.18.0.1	node	site_settings	1	\N
45	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:05.394+00	172.18.0.1	node	home_settings	1	\N
46	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:31.884+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
47	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:32.369+00	172.18.0.1	node	site_settings	1	\N
48	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:32.381+00	172.18.0.1	node	home_settings	1	\N
49	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:32.396+00	172.18.0.1	node	projects	1	\N
50	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:56:32.411+00	172.18.0.1	node	logs	1	\N
51	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 14:58:23.857+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
52	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:01:33.107+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
53	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:06:57.586+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	f996d293-b639-4238-851b-ba2172517f17	http://localhost:8055
54	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:07:13.081+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
55	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:11:03.632+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
56	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:13:46.765+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	site_settings	1	http://localhost:8055
57	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:16:10.417+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
58	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:16:30.895+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
59	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:16:44.961+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
60	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:18:07.438+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
61	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:18:34.509+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
62	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:18:49.23+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
63	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:18:49.723+00	172.18.0.1	node	logs	1	\N
64	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:18:49.738+00	172.18.0.1	node	site_settings	1	\N
65	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:35:41.991+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
66	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:35:52.057+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
67	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:36:02.687+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
68	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:36:52.367+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
69	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:36:57.224+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
70	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:37:36.417+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
71	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:38:09.5+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
72	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:38:26.323+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
73	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:19:45.197+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
74	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:35:27.605+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
75	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:35:30.562+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
76	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:40:42.386+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
77	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:49:17.556+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
78	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:49:18.142+00	172.18.0.1	node	logs	2	\N
79	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:49:18.154+00	172.18.0.1	node	logs	3	\N
80	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:49:18.164+00	172.18.0.1	node	logs	4	\N
81	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:50:08.893+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
82	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:55:07.804+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	1	http://localhost:8055
83	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 16:57:24.997+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	logs	2	http://localhost:8055
84	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:04:17.663+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
85	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:04:18.121+00	172.18.0.1	node	directus_fields	6	\N
86	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:04:18.257+00	172.18.0.1	node	logs	5	\N
87	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:05:10.123+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
88	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:07:06.562+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	6491c577-8815-410e-bfd6-f357a97ac186	http://localhost:8055
89	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:07:10.997+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	projects	1	http://localhost:8055
90	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:09:08.589+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	projects	1	http://localhost:8055
91	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:26:34.359+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
92	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:50:02.591+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
93	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:58.626+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
94	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.114+00	172.18.0.1	node	directus_fields	22	\N
95	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.258+00	172.18.0.1	node	directus_fields	23	\N
96	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.262+00	172.18.0.1	node	directus_fields	24	\N
97	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.263+00	172.18.0.1	node	directus_fields	25	\N
98	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.266+00	172.18.0.1	node	directus_fields	26	\N
99	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.267+00	172.18.0.1	node	directus_fields	27	\N
100	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.268+00	172.18.0.1	node	directus_fields	28	\N
101	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.27+00	172.18.0.1	node	directus_fields	29	\N
102	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.271+00	172.18.0.1	node	directus_fields	30	\N
103	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.272+00	172.18.0.1	node	directus_collections	about	\N
104	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.311+00	172.18.0.1	node	site_settings	1	\N
105	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:04:59.319+00	172.18.0.1	node	about	1	\N
106	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:05:12.069+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
107	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:05:55.816+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
108	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:07:37.545+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
109	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:08:56.013+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
110	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:55.437+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
111	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:55.914+00	172.18.0.1	node	directus_fields	31	\N
112	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:56.019+00	172.18.0.1	node	directus_fields	32	\N
113	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:56.021+00	172.18.0.1	node	directus_fields	33	\N
114	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:56.022+00	172.18.0.1	node	directus_fields	34	\N
115	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:13:56.024+00	172.18.0.1	node	directus_collections	about_companies	\N
116	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:14:12.501+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
117	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:23:15.897+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
118	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:23:16.478+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
119	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:23:16.979+00	172.18.0.1	node	directus_fields	30	\N
120	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:41.664+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
121	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:42.397+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
122	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:42.992+00	172.18.0.1	node	directus_collections	about_companies	\N
123	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:42.993+00	172.18.0.1	node	directus_fields	32	\N
124	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:42.994+00	172.18.0.1	node	directus_fields	33	\N
125	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:42.994+00	172.18.0.1	node	directus_fields	34	\N
126	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:43.032+00	172.18.0.1	node	directus_fields	35	\N
127	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:43.035+00	172.18.0.1	node	directus_collections	about_companies	\N
128	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:43.109+00	172.18.0.1	node	directus_fields	36	\N
129	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 18:30:58.289+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
130	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:23:23.384+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	http://localhost:8055
131	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:33:37.157+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
132	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:35:54.895+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
133	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:35:55.393+00	172.18.0.1	node	about	1	\N
134	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:36:29.926+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	ec6e7eb5-0483-415d-93cd-289a9bbdad19	http://localhost:8055
135	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:36:34.922+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
136	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:38:37.79+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
137	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:47:32.326+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
138	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:47:58.08+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
139	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:47:58.57+00	172.18.0.1	node	about	1	\N
140	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:48:31.517+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
141	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:48:32.815+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_collections	about_companies	http://localhost:8055
142	delete	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:48:32.818+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_fields	35	http://localhost:8055
143	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:50:15.984+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	30e08566-6207-4e96-bcfb-8516d883eedc	http://localhost:8055
144	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:50:19.061+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
145	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:17.848+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
146	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.315+00	172.18.0.1	node	directus_files	e1f01874-f00a-4770-85fd-8e4c942d5073	\N
147	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.34+00	172.18.0.1	node	directus_files	14d306d4-3af4-4e46-b73b-3d82009eaa9b	\N
148	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.355+00	172.18.0.1	node	directus_files	affcf61a-78e7-469b-a5e3-f5374b188fe3	\N
149	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.368+00	172.18.0.1	node	about	1	\N
150	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.391+00	172.18.0.1	node	about	1	\N
151	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:46.881+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
152	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:46.891+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
153	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:08:26.435+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	72978994-ba68-4ce1-ac38-844267b4bb1d	http://localhost:8055
154	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:17:23.886+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	893fb9e0-301e-4ec5-8061-83dc93710813	http://localhost:8055
155	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:17:25.604+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
156	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:21:41.915+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
157	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:22:04.954+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
158	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:23:04.364+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
159	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:36:36.961+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	f53cd922-44a4-403c-b56e-7f98af3578b3	http://localhost:8055
160	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:36:39.96+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
161	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:39:27.005+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
162	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:55:23.079+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
163	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:55:23.222+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
164	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:03:58.251+00	172.18.0.1	curl/8.7.1	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
165	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:04:50.977+00	172.18.0.1	curl/8.7.1	directus_permissions	1	\N
166	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:08:31.705+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14	http://localhost:8055
167	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:08:34.142+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
168	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:29.35+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
169	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:29.82+00	172.18.0.1	node	directus_fields	27	\N
170	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:29.927+00	172.18.0.1	node	directus_fields	28	\N
171	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:29.971+00	172.18.0.1	node	directus_fields	29	\N
172	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:30.017+00	172.18.0.1	node	about	1	\N
173	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:13:50.848+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
174	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:16:17.199+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
175	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:17:28.838+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
176	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:18:50.165+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d	http://localhost:8055
177	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:18:52.642+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	about	1	http://localhost:8055
178	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:29:33.584+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
179	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:34:58.318+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	site_settings	1	http://localhost:8055
180	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:40:33.937+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	210c2d58-f85a-4f9f-a333-3230b096a70c	http://localhost:8055
181	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:05.646+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	135423d8-e08d-46cd-b1ce-2189d53efa46	http://localhost:8055
182	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:09.752+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	http://localhost:8055
183	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:28.515+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_files	69291d43-21d7-423e-9055-921330fe0b16	http://localhost:8055
184	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:31.242+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	http://localhost:8055
185	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:55.337+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_roles	1a517210-06bd-4ba9-b549-491374a650f3	http://localhost:8055
186	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:46:05.168+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_roles	1a517210-06bd-4ba9-b549-491374a650f3	http://localhost:8055
187	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:46:06.892+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
188	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.185+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_access	a75e11ac-612f-40ee-a843-f91b7434b057	http://localhost:8055
189	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.198+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	2	http://localhost:8055
190	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.202+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	3	http://localhost:8055
191	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.205+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	4	http://localhost:8055
192	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.207+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	5	http://localhost:8055
193	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.21+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	6	http://localhost:8055
194	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.214+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_permissions	7	http://localhost:8055
195	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.218+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_policies	4ec5e347-7def-4052-808c-5f68c946fd38	http://localhost:8055
196	create	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.227+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_access	57c4f254-3b51-4f2e-81c2-1ec7fb35fa15	http://localhost:8055
197	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.235+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_users	210c2d58-f85a-4f9f-a333-3230b096a70c	http://localhost:8055
198	update	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:55:03.249+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	directus_roles	1a517210-06bd-4ba9-b549-491374a650f3	http://localhost:8055
199	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 03:02:27.925+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
200	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 03:02:27.931+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
201	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 03:19:51.515+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
202	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 03:49:41.73+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
203	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 04:04:58.88+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
204	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 04:21:57.216+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
205	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 04:40:26.976+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
206	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 04:40:26.977+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
207	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 04:56:09.12+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
208	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 05:09:06.875+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
209	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 05:09:06.876+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
210	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 05:09:34.649+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
211	login	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 05:09:34.649+00	172.18.0.1	node	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N
\.


--
-- Data for Name: directus_collections; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort, "group", collapse, preview_url, versioning) FROM stdin;
projects	work	\N	{{title}}	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
logs	article	\N	{{title}}	f	f	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
site_settings	settings	\N	\N	f	t	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
home_settings	home	\N	\N	f	t	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
about	person	Global settings for the unified About page.	\N	f	t	\N	\N	t	\N	\N	\N	all	\N	\N	\N	\N	open	\N	f
\.


--
-- Data for Name: directus_comments; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_comments (id, collection, item, comment, date_created, date_updated, user_created, user_updated) FROM stdin;
\.


--
-- Data for Name: directus_dashboards; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_dashboards (id, name, icon, note, date_created, user_created, color) FROM stdin;
\.


--
-- Data for Name: directus_deployment_projects; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_deployment_projects (id, deployment, external_id, name, date_created, user_created, url, framework, deployable) FROM stdin;
\.


--
-- Data for Name: directus_deployment_runs; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_deployment_runs (id, project, external_id, target, date_created, user_created, status, url, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: directus_deployments; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_deployments (id, provider, credentials, options, date_created, user_created, webhook_ids, webhook_secret, last_synced_at) FROM stdin;
\.


--
-- Data for Name: directus_extensions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_extensions (enabled, id, folder, source, bundle) FROM stdin;
\.


--
-- Data for Name: directus_fields; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_fields (id, collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message, searchable) FROM stdin;
1	projects	id	\N	numeric	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N	t
2	projects	title	\N	input	\N	\N	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N	t
3	projects	slug	\N	input	\N	\N	\N	f	f	3	full	\N	\N	\N	f	\N	\N	\N	t
4	projects	summary	\N	textarea	\N	\N	\N	f	f	4	full	\N	\N	\N	f	\N	\N	\N	t
5	projects	description	\N	input-rich-text-html	\N	\N	\N	f	f	5	full	\N	\N	\N	f	\N	\N	\N	t
7	projects	tags	cast-json	tags	\N	\N	\N	f	f	7	full	\N	\N	\N	f	\N	\N	\N	t
8	projects	published_at	\N	datetime	\N	\N	\N	f	f	8	full	\N	\N	\N	f	\N	\N	\N	t
9	projects	featured	\N	boolean	\N	\N	\N	f	f	9	full	\N	\N	\N	f	\N	\N	\N	t
10	logs	id	\N	numeric	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N	t
11	logs	title	\N	input	\N	\N	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N	t
12	logs	slug	\N	input	\N	\N	\N	f	f	3	full	\N	\N	\N	f	\N	\N	\N	t
13	logs	excerpt	\N	textarea	\N	\N	\N	f	f	4	full	\N	\N	\N	f	\N	\N	\N	t
15	logs	published_at	\N	datetime	\N	\N	\N	f	f	6	full	\N	\N	\N	f	\N	\N	\N	t
16	logs	tag	\N	input	\N	\N	\N	f	f	7	full	\N	\N	\N	f	\N	\N	\N	t
17	logs	category	\N	input	\N	\N	\N	f	f	8	full	\N	\N	\N	f	\N	\N	\N	t
18	logs	log_number	\N	input	\N	\N	\N	f	f	9	full	\N	\N	\N	f	\N	\N	\N	t
19	logs	series_label	\N	input	\N	\N	\N	f	f	10	full	\N	\N	\N	f	\N	\N	\N	t
20	site_settings	id	\N	numeric	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N	t
21	home_settings	id	\N	numeric	\N	\N	\N	t	t	1	full	\N	\N	\N	f	\N	\N	\N	t
14	logs	content	\N	input-rich-text-html	\N	formatted-value	\N	f	f	5	full	\N	\N	\N	f	\N	\N	\N	t
6	projects	cover_image	\N	file-image	\N	image	\N	f	f	6	full	\N	\N	\N	f	\N	\N	\N	t
22	site_settings	twitter	\N	input	\N	raw	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N	t
23	about	hero_tagline	\N	input	\N	\N	\N	f	f	1	full	\N	\N	\N	f	\N	\N	\N	t
24	about	hero_title	\N	input	\N	\N	\N	f	f	2	full	\N	\N	\N	f	\N	\N	\N	t
25	about	hero_description	\N	input-multiline	\N	\N	\N	f	f	3	full	\N	\N	\N	f	\N	\N	\N	t
26	about	profile_image	\N	file-image	\N	image	\N	f	f	4	full	\N	\N	\N	f	\N	\N	\N	t
31	about	resume	\N	file	\N	file	\N	f	f	9	full	\N	\N	\N	f	\N	\N	\N	t
36	about	companies	\N	files	\N	related-values	\N	f	f	10	full	\N	\N	\N	f	\N	\N	\N	t
27	about	stats	cast-json	list	{"fields":[{"field":"number","type":"string","name":"Number","meta":{"interface":"input","width":"half"}},{"field":"label","type":"string","name":"Label","meta":{"interface":"input","width":"half"}}]}	\N	\N	f	f	5	full	\N	Array of objects: {"number": "42", "label": "Production models"}	\N	f	\N	\N	\N	t
28	about	experience	cast-json	list	{"fields":[{"field":"date","type":"string","name":"Date Range","meta":{"interface":"input","width":"half"}},{"field":"tag","type":"string","name":"Tag","meta":{"interface":"input","width":"half"}},{"field":"title","type":"string","name":"Title","meta":{"interface":"input","width":"full"}},{"field":"subtitle","type":"string","name":"Subtitle","meta":{"interface":"input","width":"full"}}]}	\N	\N	f	f	6	full	\N	Array of objects: {"date": "2021—PRES", "title": "SENIOR DATA ANALYST", "subtitle": "NEURAL SYSTEMS INC.", "tag": "FULL-TIME"}	\N	f	\N	\N	\N	t
29	about	skills	cast-json	list	{"fields":[{"field":"header","type":"string","name":"Header (e.g. 01 / CORE)","meta":{"interface":"input","width":"half"}},{"field":"name","type":"string","name":"Category Name","meta":{"interface":"input","width":"half"}},{"field":"items","type":"json","name":"Skill Items","meta":{"interface":"list","options":{"fields":[{"field":"name","type":"string","name":"Skill Name","meta":{"interface":"input","width":"half"}},{"field":"suffix","type":"string","name":"Level (PRO/ADV)","meta":{"interface":"input","width":"half"}}]}}}]}	\N	\N	f	f	7	full	\N	Array of objects: {"header": "01 // CORE", "name": "DATA ANALYSIS", "items": [{"name": "PYTHON", "suffix": "V3.11"}]}	\N	f	\N	\N	\N	t
\.


--
-- Data for Name: directus_files; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_files (id, storage, filename_disk, filename_download, title, type, folder, uploaded_by, created_on, modified_by, modified_on, charset, filesize, width, height, duration, embed, description, location, tags, metadata, focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on) FROM stdin;
21370c33-bbf1-4436-b2ed-b9e9d70b936a	local	21370c33-bbf1-4436-b2ed-b9e9d70b936a.svg	logo.svg	Logo	image/svg+xml	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:08:41.647+00	\N	2026-03-06 01:08:41.673+00	\N	3436	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 01:08:41.672+00
dd95fd0e-9f91-44ad-9c74-bd5ca47998ac	local	dd95fd0e-9f91-44ad-9c74-bd5ca47998ac.svg	logo.svg	Logo	image/svg+xml	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-06 01:09:31.794+00	\N	2026-03-06 01:09:31.818+00	\N	3436	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 01:09:31.817+00
f996d293-b639-4238-851b-ba2172517f17	local	f996d293-b639-4238-851b-ba2172517f17.png	diagram.png	Diagram	image/png	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 15:06:57.569+00	\N	2026-03-20 15:06:57.6+00	\N	6664	349	144	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	2026-03-20 15:06:57.6+00
6491c577-8815-410e-bfd6-f357a97ac186	local	6491c577-8815-410e-bfd6-f357a97ac186.webp	digital-phoenix-rising-stockcake.webp	Digital Phoenix Rising Stockcake	image/webp	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-20 17:07:06.554+00	\N	2026-03-20 17:07:06.578+00	\N	6976	336	192	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	2026-03-20 17:07:06.577+00
ec6e7eb5-0483-415d-93cd-289a9bbdad19	local	ec6e7eb5-0483-415d-93cd-289a9bbdad19.JPG	syed_profile_picture_1.JPG	Syed Profile Picture 1	image/jpeg	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:36:29.917+00	\N	2026-03-22 00:36:29.998+00	\N	6639435	3648	5472	\N	\N	\N	\N	\N	{"ifd0":{"Make":"Canon","Model":"Canon PowerShot G7 X Mark II"},"exif":{"FNumber":2.8,"ExposureTime":0.00625,"FocalLength":30.458,"ISOSpeedRatings":400}}	\N	\N	\N	\N	2026-03-22 00:36:29.997+00
30e08566-6207-4e96-bcfb-8516d883eedc	local	30e08566-6207-4e96-bcfb-8516d883eedc.pdf	Syed_Atef_Alvi_Resume_2023.pdf	Syed Atef Alvi Resume 2023	application/pdf	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 00:50:15.973+00	\N	2026-03-22 00:50:15.996+00	\N	308195	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 00:50:15.995+00
e1f01874-f00a-4770-85fd-8e4c942d5073	local	e1f01874-f00a-4770-85fd-8e4c942d5073.png	profile_glitch_1774141564571.png	Profile Glitch	application/octet-stream	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.313+00	\N	2026-03-22 01:07:18.326+00	\N	80387	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 01:07:18.325+00
14d306d4-3af4-4e46-b73b-3d82009eaa9b	local	14d306d4-3af4-4e46-b73b-3d82009eaa9b.png	logo_alphabet_1774141582132.png	Alphabet Logo	application/octet-stream	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.339+00	\N	2026-03-22 01:07:18.346+00	\N	28818	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 01:07:18.345+00
affcf61a-78e7-469b-a5e3-f5374b188fe3	local	affcf61a-78e7-469b-a5e3-f5374b188fe3.png	logo_stripe_1774141591938.png	Stripe Logo	application/octet-stream	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:07:18.355+00	\N	2026-03-22 01:07:18.359+00	\N	21041	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 01:07:18.359+00
72978994-ba68-4ce1-ac38-844267b4bb1d	local	72978994-ba68-4ce1-ac38-844267b4bb1d.JPG	syed_profile_picture_1.JPG	Syed Profile Picture 1	image/jpeg	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:08:26.417+00	\N	2026-03-22 01:08:26.502+00	\N	6639435	3648	5472	\N	\N	\N	\N	\N	{"ifd0":{"Make":"Canon","Model":"Canon PowerShot G7 X Mark II"},"exif":{"FNumber":2.8,"ExposureTime":0.00625,"FocalLength":30.458,"ISOSpeedRatings":400}}	\N	\N	\N	\N	2026-03-22 01:08:26.502+00
893fb9e0-301e-4ec5-8061-83dc93710813	local	893fb9e0-301e-4ec5-8061-83dc93710813.JPG	syed_profile_picture_1.JPG	Syed Profile Picture 1	image/jpeg	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:17:23.871+00	\N	2026-03-22 01:17:23.986+00	\N	6639435	3648	5472	\N	\N	\N	\N	\N	{"ifd0":{"Make":"Canon","Model":"Canon PowerShot G7 X Mark II"},"exif":{"FNumber":2.8,"ExposureTime":0.00625,"FocalLength":30.458,"ISOSpeedRatings":400}}	\N	\N	\N	\N	2026-03-22 01:17:23.985+00
f53cd922-44a4-403c-b56e-7f98af3578b3	local	f53cd922-44a4-403c-b56e-7f98af3578b3.png	profile.png	Profile	image/png	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 01:36:36.942+00	\N	2026-03-22 01:36:37.309+00	\N	15202491	3648	5472	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	2026-03-22 01:36:37.307+00
62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14	local	62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14.JPG	syed_profile_picture_1.JPG	Syed Profile Picture 1	image/jpeg	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:08:31.678+00	\N	2026-03-22 02:08:31.879+00	\N	6639435	3648	5472	\N	\N	\N	\N	\N	{"ifd0":{"Make":"Canon","Model":"Canon PowerShot G7 X Mark II"},"exif":{"FNumber":2.8,"ExposureTime":0.00625,"FocalLength":30.458,"ISOSpeedRatings":400}}	\N	\N	\N	\N	2026-03-22 02:08:31.876+00
8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d	local	8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d.png	profile.png	Profile	image/png	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:18:50.151+00	\N	2026-03-22 02:18:50.295+00	\N	15202491	3648	5472	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	2026-03-22 02:18:50.295+00
135423d8-e08d-46cd-b1ce-2189d53efa46	local	135423d8-e08d-46cd-b1ce-2189d53efa46.png	test1 circle.png	Test1 Circle	image/png	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:05.633+00	\N	2026-03-22 02:41:05.67+00	\N	1182252	1080	1080	\N	\N	\N	\N	\N	{}	\N	\N	\N	\N	2026-03-22 02:41:05.67+00
69291d43-21d7-423e-9055-921330fe0b16	local	69291d43-21d7-423e-9055-921330fe0b16.JPG	syed_profile_picture_1.JPG	Syed Profile Picture 1	image/jpeg	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-22 02:41:28.512+00	\N	2026-03-22 02:41:28.582+00	\N	6639435	3648	5472	\N	\N	\N	\N	\N	{"ifd0":{"Make":"Canon","Model":"Canon PowerShot G7 X Mark II"},"exif":{"FNumber":2.8,"ExposureTime":0.00625,"FocalLength":30.458,"ISOSpeedRatings":400}}	\N	\N	\N	\N	2026-03-22 02:41:28.581+00
\.


--
-- Data for Name: directus_flows; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_flows (id, name, icon, color, description, status, trigger, accountability, options, operation, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_folders; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_folders (id, name, parent) FROM stdin;
\.


--
-- Data for Name: directus_migrations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_migrations (version, name, "timestamp") FROM stdin;
20201028A	Remove Collection Foreign Keys	2026-03-05 20:07:03.531779+00
20201029A	Remove System Relations	2026-03-05 20:07:03.537974+00
20201029B	Remove System Collections	2026-03-05 20:07:03.542569+00
20201029C	Remove System Fields	2026-03-05 20:07:03.547435+00
20201105A	Add Cascade System Relations	2026-03-05 20:07:03.56192+00
20201105B	Change Webhook URL Type	2026-03-05 20:07:03.566987+00
20210225A	Add Relations Sort Field	2026-03-05 20:07:03.570529+00
20210304A	Remove Locked Fields	2026-03-05 20:07:03.572315+00
20210312A	Webhooks Collections Text	2026-03-05 20:07:03.575089+00
20210331A	Add Refresh Interval	2026-03-05 20:07:03.576348+00
20210415A	Make Filesize Nullable	2026-03-05 20:07:03.57959+00
20210416A	Add Collections Accountability	2026-03-05 20:07:03.581577+00
20210422A	Remove Files Interface	2026-03-05 20:07:03.582764+00
20210506A	Rename Interfaces	2026-03-05 20:07:03.589883+00
20210510A	Restructure Relations	2026-03-05 20:07:03.59435+00
20210518A	Add Foreign Key Constraints	2026-03-05 20:07:03.599381+00
20210519A	Add System Fk Triggers	2026-03-05 20:07:03.609506+00
20210521A	Add Collections Icon Color	2026-03-05 20:07:03.61049+00
20210525A	Add Insights	2026-03-05 20:07:03.619391+00
20210608A	Add Deep Clone Config	2026-03-05 20:07:03.620673+00
20210626A	Change Filesize Bigint	2026-03-05 20:07:03.630729+00
20210716A	Add Conditions to Fields	2026-03-05 20:07:03.631892+00
20210721A	Add Default Folder	2026-03-05 20:07:03.634173+00
20210802A	Replace Groups	2026-03-05 20:07:03.636179+00
20210803A	Add Required to Fields	2026-03-05 20:07:03.637199+00
20210805A	Update Groups	2026-03-05 20:07:03.638845+00
20210805B	Change Image Metadata Structure	2026-03-05 20:07:03.640503+00
20210811A	Add Geometry Config	2026-03-05 20:07:03.641422+00
20210831A	Remove Limit Column	2026-03-05 20:07:03.642193+00
20210903A	Add Auth Provider	2026-03-05 20:07:03.647357+00
20210907A	Webhooks Collections Not Null	2026-03-05 20:07:03.649558+00
20210910A	Move Module Setup	2026-03-05 20:07:03.650546+00
20210920A	Webhooks URL Not Null	2026-03-05 20:07:03.652388+00
20210924A	Add Collection Organization	2026-03-05 20:07:03.654483+00
20210927A	Replace Fields Group	2026-03-05 20:07:03.657459+00
20210927B	Replace M2M Interface	2026-03-05 20:07:03.658501+00
20210929A	Rename Login Action	2026-03-05 20:07:03.659339+00
20211007A	Update Presets	2026-03-05 20:07:03.661319+00
20211009A	Add Auth Data	2026-03-05 20:07:03.662065+00
20211016A	Add Webhook Headers	2026-03-05 20:07:03.662928+00
20211103A	Set Unique to User Token	2026-03-05 20:07:03.664633+00
20211103B	Update Special Geometry	2026-03-05 20:07:03.665729+00
20211104A	Remove Collections Listing	2026-03-05 20:07:03.666596+00
20211118A	Add Notifications	2026-03-05 20:07:03.673622+00
20211211A	Add Shares	2026-03-05 20:07:03.681096+00
20211230A	Add Project Descriptor	2026-03-05 20:07:03.681968+00
20220303A	Remove Default Project Color	2026-03-05 20:07:03.684196+00
20220308A	Add Bookmark Icon and Color	2026-03-05 20:07:03.685085+00
20220314A	Add Translation Strings	2026-03-05 20:07:03.685986+00
20220322A	Rename Field Typecast Flags	2026-03-05 20:07:03.687729+00
20220323A	Add Field Validation	2026-03-05 20:07:03.68883+00
20220325A	Fix Typecast Flags	2026-03-05 20:07:03.690391+00
20220325B	Add Default Language	2026-03-05 20:07:03.69299+00
20220402A	Remove Default Value Panel Icon	2026-03-05 20:07:03.694944+00
20220429A	Add Flows	2026-03-05 20:07:03.709319+00
20220429B	Add Color to Insights Icon	2026-03-05 20:07:03.710343+00
20220429C	Drop Non Null From IP of Activity	2026-03-05 20:07:03.711114+00
20220429D	Drop Non Null From Sender of Notifications	2026-03-05 20:07:03.711865+00
20220614A	Rename Hook Trigger to Event	2026-03-05 20:07:03.712792+00
20220801A	Update Notifications Timestamp Column	2026-03-05 20:07:03.714963+00
20220802A	Add Custom Aspect Ratios	2026-03-05 20:07:03.715865+00
20220826A	Add Origin to Accountability	2026-03-05 20:07:03.716924+00
20230401A	Update Material Icons	2026-03-05 20:07:03.719315+00
20230525A	Add Preview Settings	2026-03-05 20:07:03.720057+00
20230526A	Migrate Translation Strings	2026-03-05 20:07:03.724703+00
20230721A	Require Shares Fields	2026-03-05 20:07:03.726351+00
20230823A	Add Content Versioning	2026-03-05 20:07:03.734721+00
20230927A	Themes	2026-03-05 20:07:03.73987+00
20231009A	Update CSV Fields to Text	2026-03-05 20:07:03.74195+00
20231009B	Update Panel Options	2026-03-05 20:07:03.742825+00
20231010A	Add Extensions	2026-03-05 20:07:03.74497+00
20231215A	Add Focalpoints	2026-03-05 20:07:03.745793+00
20240122A	Add Report URL Fields	2026-03-05 20:07:03.746597+00
20240204A	Marketplace	2026-03-05 20:07:03.754551+00
20240305A	Change Useragent Type	2026-03-05 20:07:03.757625+00
20240311A	Deprecate Webhooks	2026-03-05 20:07:03.761226+00
20240422A	Public Registration	2026-03-05 20:07:03.765911+00
20240515A	Add Session Window	2026-03-05 20:07:03.767389+00
20240701A	Add Tus Data	2026-03-05 20:07:03.768592+00
20240716A	Update Files Date Fields	2026-03-05 20:07:03.773746+00
20240806A	Permissions Policies	2026-03-05 20:07:03.792396+00
20240817A	Update Icon Fields Length	2026-03-05 20:07:03.799682+00
20240909A	Separate Comments	2026-03-05 20:07:03.805009+00
20240909B	Consolidate Content Versioning	2026-03-05 20:07:03.805857+00
20240924A	Migrate Legacy Comments	2026-03-05 20:07:03.808527+00
20240924B	Populate Versioning Deltas	2026-03-05 20:07:03.810101+00
20250224A	Visual Editor	2026-03-05 20:07:03.811271+00
20250609A	License Banner	2026-03-05 20:07:03.812777+00
20250613A	Add Project ID	2026-03-05 20:07:03.817698+00
20250718A	Add Direction	2026-03-05 20:07:03.818615+00
20250813A	Add MCP	2026-03-05 20:07:03.820374+00
20251012A	Add Field Searchable	2026-03-05 20:07:03.821244+00
20251014A	Add Project Owner	2026-03-05 20:07:03.898599+00
20251028A	Add Retention Indexes	2026-03-05 20:07:03.945729+00
20251103A	Add AI Settings	2026-03-05 20:07:03.948614+00
20251224A	Remove Webhooks	2026-03-05 20:07:03.954731+00
20260110A	Add AI Provider Settings	2026-03-05 20:07:03.959886+00
20260113A	Add Revisions Index	2026-03-05 20:07:03.9695+00
20260128A	Add Collaborative Editing	2026-03-05 20:07:03.97227+00
20260204A	Add Deployment	2026-03-05 20:07:03.998417+00
20260211A	Add Deployment Webhooks	2026-03-05 20:07:04.001514+00
\.


--
-- Data for Name: directus_notifications; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_notifications (id, "timestamp", status, recipient, sender, subject, message, collection, item) FROM stdin;
\.


--
-- Data for Name: directus_operations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_operations (id, name, key, type, position_x, position_y, options, resolve, reject, flow, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_panels; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_panels (id, dashboard, name, icon, color, show_header, note, type, position_x, position_y, width, height, options, date_created, user_created) FROM stdin;
\.


--
-- Data for Name: directus_permissions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_permissions (id, collection, action, permissions, validation, presets, fields, policy) FROM stdin;
1	directus_files	read	{}	{}	\N	\N	abf8a154-5b1c-4a46-ac9c-7300570f4f17
2	logs	create	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
3	logs	read	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
4	logs	update	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
5	logs	share	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
6	directus_files	create	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
7	directus_files	read	\N	\N	\N	*	4ec5e347-7def-4052-808c-5f68c946fd38
\.


--
-- Data for Name: directus_policies; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_policies (id, name, icon, description, ip_access, enforce_tfa, admin_access, app_access) FROM stdin;
abf8a154-5b1c-4a46-ac9c-7300570f4f17	$t:public_label	public	$t:public_description	\N	f	f	f
1dc3ec5f-0fb5-4fa5-ae5b-75d5529ea868	Administrator	verified	$t:admin_description	\N	f	t	t
4ec5e347-7def-4052-808c-5f68c946fd38	Agent Clerk - Blog Writer	badge	\N	\N	f	f	t
\.


--
-- Data for Name: directus_presets; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_presets (id, bookmark, "user", role, collection, search, layout, layout_query, layout_options, refresh_interval, filter, icon, color) FROM stdin;
2	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N	logs	\N	\N	\N	\N	300	\N	bookmark	\N
1	\N	b33b41c7-4075-4a71-94ca-20bc6ebfc634	\N	directus_users	\N	cards	{"cards":{"sort":["email"],"page":1}}	{"cards":{"icon":"account_circle","title":"{{ first_name }} {{ last_name }}","subtitle":"{{ email }}","size":4}}	\N	\N	bookmark	\N
\.


--
-- Data for Name: directus_relations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_relations (id, many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action) FROM stdin;
1	projects	cover_image	directus_files	\N	\N	\N	\N	\N	nullify
2	about	profile_image	directus_files	\N	\N	\N	\N	\N	nullify
3	about	resume	directus_files	\N	\N	\N	\N	\N	nullify
\.


--
-- Data for Name: directus_revisions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_revisions (id, activity, collection, item, data, delta, parent, version) FROM stdin;
1	2	directus_settings	1	{"id":1,"project_name":"Directus","project_url":null,"project_color":"#6644FF","project_logo":null,"public_foreground":null,"public_background":null,"public_note":null,"auth_login_attempts":25,"auth_password_policy":null,"storage_asset_transform":"all","storage_asset_presets":null,"custom_css":null,"storage_default_folder":null,"basemaps":null,"mapbox_key":null,"module_bar":null,"project_descriptor":null,"default_language":"en-US","custom_aspect_ratios":null,"public_favicon":null,"default_appearance":"auto","default_theme_light":null,"theme_light_overrides":null,"default_theme_dark":null,"theme_dark_overrides":null,"report_error_url":null,"report_bug_url":null,"report_feature_url":null,"public_registration":false,"public_registration_verify_email":true,"public_registration_role":null,"public_registration_email_filter":null,"visual_editor_urls":null,"project_id":"019cbf9c-6588-7587-92f0-72128037caba","mcp_enabled":false,"mcp_allow_deletes":false,"mcp_prompts_collection":null,"mcp_system_prompt_enabled":true,"mcp_system_prompt":null,"project_owner":"atefalvi@gmail.com","project_usage":"personal","org_name":null,"product_updates":true,"project_status":null,"ai_openai_api_key":null,"ai_anthropic_api_key":null,"ai_system_prompt":null,"ai_google_api_key":null,"ai_openai_compatible_api_key":null,"ai_openai_compatible_base_url":null,"ai_openai_compatible_name":null,"ai_openai_compatible_models":null,"ai_openai_compatible_headers":null,"ai_openai_allowed_models":["gpt-5-nano","gpt-5-mini","gpt-5"],"ai_anthropic_allowed_models":["claude-haiku-4-5","claude-sonnet-4-5"],"ai_google_allowed_models":["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"],"collaborative_editing_enabled":false}	{"project_owner":"atefalvi@gmail.com","project_usage":"personal","org_name":null,"product_updates":true,"project_status":null}	\N	\N
2	3	directus_files	21370c33-bbf1-4436-b2ed-b9e9d70b936a	{"title":"Logo","filename_download":"logo.svg","type":"image/svg+xml","storage":"local"}	{"title":"Logo","filename_download":"logo.svg","type":"image/svg+xml","storage":"local"}	\N	\N
3	4	directus_settings	1	{"id":1,"project_name":"Directus","project_url":null,"project_color":"#6644FF","project_logo":"21370c33-bbf1-4436-b2ed-b9e9d70b936a","public_foreground":null,"public_background":null,"public_note":null,"auth_login_attempts":25,"auth_password_policy":null,"storage_asset_transform":"all","storage_asset_presets":null,"custom_css":null,"storage_default_folder":null,"basemaps":null,"mapbox_key":null,"module_bar":null,"project_descriptor":null,"default_language":"en-US","custom_aspect_ratios":null,"public_favicon":null,"default_appearance":"auto","default_theme_light":null,"theme_light_overrides":null,"default_theme_dark":null,"theme_dark_overrides":null,"report_error_url":null,"report_bug_url":null,"report_feature_url":null,"public_registration":false,"public_registration_verify_email":true,"public_registration_role":null,"public_registration_email_filter":null,"visual_editor_urls":null,"project_id":"019cbf9c-6588-7587-92f0-72128037caba","mcp_enabled":false,"mcp_allow_deletes":false,"mcp_prompts_collection":null,"mcp_system_prompt_enabled":true,"mcp_system_prompt":null,"project_owner":"atefalvi@gmail.com","project_usage":"personal","org_name":null,"product_updates":true,"project_status":null,"ai_openai_api_key":null,"ai_anthropic_api_key":null,"ai_system_prompt":null,"ai_google_api_key":null,"ai_openai_compatible_api_key":null,"ai_openai_compatible_base_url":null,"ai_openai_compatible_name":null,"ai_openai_compatible_models":null,"ai_openai_compatible_headers":null,"ai_openai_allowed_models":["gpt-5-nano","gpt-5-mini","gpt-5"],"ai_anthropic_allowed_models":["claude-haiku-4-5","claude-sonnet-4-5"],"ai_google_allowed_models":["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"],"collaborative_editing_enabled":false}	{"project_logo":"21370c33-bbf1-4436-b2ed-b9e9d70b936a"}	\N	\N
4	5	directus_files	dd95fd0e-9f91-44ad-9c74-bd5ca47998ac	{"title":"Logo","filename_download":"logo.svg","type":"image/svg+xml","storage":"local"}	{"title":"Logo","filename_download":"logo.svg","type":"image/svg+xml","storage":"local"}	\N	\N
5	6	directus_settings	1	{"id":1,"project_name":"Directus","project_url":null,"project_color":"#6644FF","project_logo":"21370c33-bbf1-4436-b2ed-b9e9d70b936a","public_foreground":null,"public_background":null,"public_note":null,"auth_login_attempts":25,"auth_password_policy":null,"storage_asset_transform":"all","storage_asset_presets":null,"custom_css":null,"storage_default_folder":null,"basemaps":null,"mapbox_key":null,"module_bar":null,"project_descriptor":null,"default_language":"en-US","custom_aspect_ratios":null,"public_favicon":"dd95fd0e-9f91-44ad-9c74-bd5ca47998ac","default_appearance":"auto","default_theme_light":null,"theme_light_overrides":null,"default_theme_dark":null,"theme_dark_overrides":null,"report_error_url":null,"report_bug_url":null,"report_feature_url":null,"public_registration":false,"public_registration_verify_email":true,"public_registration_role":null,"public_registration_email_filter":null,"visual_editor_urls":null,"project_id":"019cbf9c-6588-7587-92f0-72128037caba","mcp_enabled":false,"mcp_allow_deletes":false,"mcp_prompts_collection":null,"mcp_system_prompt_enabled":true,"mcp_system_prompt":null,"project_owner":"atefalvi@gmail.com","project_usage":"personal","org_name":null,"product_updates":true,"project_status":null,"ai_openai_api_key":null,"ai_anthropic_api_key":null,"ai_system_prompt":null,"ai_google_api_key":null,"ai_openai_compatible_api_key":null,"ai_openai_compatible_base_url":null,"ai_openai_compatible_name":null,"ai_openai_compatible_models":null,"ai_openai_compatible_headers":null,"ai_openai_allowed_models":["gpt-5-nano","gpt-5-mini","gpt-5"],"ai_anthropic_allowed_models":["claude-haiku-4-5","claude-sonnet-4-5"],"ai_google_allowed_models":["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"],"collaborative_editing_enabled":false}	{"public_favicon":"dd95fd0e-9f91-44ad-9c74-bd5ca47998ac"}	\N	\N
6	7	directus_settings	1	{"id":1,"project_name":"Directus","project_url":null,"project_color":"#6644FF","project_logo":null,"public_foreground":null,"public_background":null,"public_note":null,"auth_login_attempts":25,"auth_password_policy":null,"storage_asset_transform":"all","storage_asset_presets":null,"custom_css":null,"storage_default_folder":null,"basemaps":null,"mapbox_key":null,"module_bar":null,"project_descriptor":null,"default_language":"en-US","custom_aspect_ratios":null,"public_favicon":null,"default_appearance":"auto","default_theme_light":null,"theme_light_overrides":null,"default_theme_dark":null,"theme_dark_overrides":null,"report_error_url":null,"report_bug_url":null,"report_feature_url":null,"public_registration":false,"public_registration_verify_email":true,"public_registration_role":null,"public_registration_email_filter":null,"visual_editor_urls":null,"project_id":"019cbf9c-6588-7587-92f0-72128037caba","mcp_enabled":false,"mcp_allow_deletes":false,"mcp_prompts_collection":null,"mcp_system_prompt_enabled":true,"mcp_system_prompt":null,"project_owner":"atefalvi@gmail.com","project_usage":"personal","org_name":null,"product_updates":true,"project_status":null,"ai_openai_api_key":null,"ai_anthropic_api_key":null,"ai_system_prompt":null,"ai_google_api_key":null,"ai_openai_compatible_api_key":null,"ai_openai_compatible_base_url":null,"ai_openai_compatible_name":null,"ai_openai_compatible_models":null,"ai_openai_compatible_headers":null,"ai_openai_allowed_models":["gpt-5-nano","gpt-5-mini","gpt-5"],"ai_anthropic_allowed_models":["claude-haiku-4-5","claude-sonnet-4-5"],"ai_google_allowed_models":["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"],"collaborative_editing_enabled":false}	{"project_logo":null,"public_favicon":null}	\N	\N
7	11	directus_fields	1	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"projects"}	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"projects"}	\N	\N
8	12	directus_collections	projects	{"display_template":"{{title}}","icon":"work","collection":"projects"}	{"display_template":"{{title}}","icon":"work","collection":"projects"}	\N	\N
9	13	directus_fields	2	{"sort":2,"interface":"input","collection":"projects","field":"title"}	{"sort":2,"interface":"input","collection":"projects","field":"title"}	\N	\N
10	14	directus_fields	3	{"sort":3,"interface":"input","collection":"projects","field":"slug"}	{"sort":3,"interface":"input","collection":"projects","field":"slug"}	\N	\N
11	15	directus_fields	4	{"sort":4,"interface":"textarea","collection":"projects","field":"summary"}	{"sort":4,"interface":"textarea","collection":"projects","field":"summary"}	\N	\N
12	16	directus_fields	5	{"sort":5,"interface":"input-rich-text-html","collection":"projects","field":"description"}	{"sort":5,"interface":"input-rich-text-html","collection":"projects","field":"description"}	\N	\N
13	17	directus_fields	6	{"sort":6,"interface":"file","collection":"projects","field":"cover_image"}	{"sort":6,"interface":"file","collection":"projects","field":"cover_image"}	\N	\N
14	18	directus_fields	7	{"sort":7,"interface":"tags","special":["cast-json"],"collection":"projects","field":"tags"}	{"sort":7,"interface":"tags","special":["cast-json"],"collection":"projects","field":"tags"}	\N	\N
15	19	directus_fields	8	{"sort":8,"interface":"datetime","collection":"projects","field":"published_at"}	{"sort":8,"interface":"datetime","collection":"projects","field":"published_at"}	\N	\N
16	20	directus_fields	9	{"sort":9,"interface":"boolean","collection":"projects","field":"featured"}	{"sort":9,"interface":"boolean","collection":"projects","field":"featured"}	\N	\N
17	21	directus_fields	10	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"logs"}	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"logs"}	\N	\N
18	22	directus_collections	logs	{"display_template":"{{title}}","icon":"article","collection":"logs"}	{"display_template":"{{title}}","icon":"article","collection":"logs"}	\N	\N
19	23	directus_fields	11	{"sort":2,"interface":"input","collection":"logs","field":"title"}	{"sort":2,"interface":"input","collection":"logs","field":"title"}	\N	\N
20	24	directus_fields	12	{"sort":3,"interface":"input","collection":"logs","field":"slug"}	{"sort":3,"interface":"input","collection":"logs","field":"slug"}	\N	\N
21	25	directus_fields	13	{"sort":4,"interface":"textarea","collection":"logs","field":"excerpt"}	{"sort":4,"interface":"textarea","collection":"logs","field":"excerpt"}	\N	\N
22	26	directus_fields	14	{"sort":5,"interface":"input-rich-text-markdown","collection":"logs","field":"content"}	{"sort":5,"interface":"input-rich-text-markdown","collection":"logs","field":"content"}	\N	\N
23	27	directus_fields	15	{"sort":6,"interface":"datetime","collection":"logs","field":"published_at"}	{"sort":6,"interface":"datetime","collection":"logs","field":"published_at"}	\N	\N
24	28	directus_fields	16	{"sort":7,"interface":"input","collection":"logs","field":"tag"}	{"sort":7,"interface":"input","collection":"logs","field":"tag"}	\N	\N
25	29	directus_fields	17	{"sort":8,"interface":"input","collection":"logs","field":"category"}	{"sort":8,"interface":"input","collection":"logs","field":"category"}	\N	\N
26	30	directus_fields	18	{"sort":9,"interface":"input","collection":"logs","field":"log_number"}	{"sort":9,"interface":"input","collection":"logs","field":"log_number"}	\N	\N
27	31	directus_fields	19	{"sort":10,"interface":"input","collection":"logs","field":"series_label"}	{"sort":10,"interface":"input","collection":"logs","field":"series_label"}	\N	\N
28	32	directus_fields	20	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"site_settings"}	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"site_settings"}	\N	\N
29	33	directus_collections	site_settings	{"singleton":true,"icon":"settings","collection":"site_settings"}	{"singleton":true,"icon":"settings","collection":"site_settings"}	\N	\N
30	34	directus_fields	21	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"home_settings"}	{"sort":1,"hidden":true,"interface":"numeric","readonly":true,"field":"id","collection":"home_settings"}	\N	\N
31	35	directus_collections	home_settings	{"singleton":true,"icon":"home","collection":"home_settings"}	{"singleton":true,"icon":"home","collection":"home_settings"}	\N	\N
32	36	projects	1	{"title":"Project Phoenix","slug":"project-phoenix","summary":"A revolutionary data processing engine built with Astro and Directus.","description":"<h1>Project Phoenix</h1><p>Detailed description of Project Phoenix.</p>","tags":["AI","Data Engineering","Directus"],"published_at":"2026-03-20T14:43:29.716Z","featured":true}	{"title":"Project Phoenix","slug":"project-phoenix","summary":"A revolutionary data processing engine built with Astro and Directus.","description":"<h1>Project Phoenix</h1><p>Detailed description of Project Phoenix.</p>","tags":["AI","Data Engineering","Directus"],"published_at":"2026-03-20T14:43:29.716Z","featured":true}	\N	\N
33	37	logs	1	{"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"\\n# The Future of Agentic Coding\\n\\nThis is a test log entry demonstrating custom callouts.\\n\\n:::callout{type=\\"info\\"}\\nAgentic coding is the next evolution of pair programming.\\n:::\\n\\n## Key Benefits\\n\\n- Increased velocity\\n- Reduced boilerplate\\n- Intelligent refactoring\\n\\n:::callout{type=\\"warning\\"}\\nAlways review the code generated by AI agents!\\n:::\\n\\n### Code Example\\n\\n```typescript\\nconst dreamer = new Agent({\\n  mode: 'DataDreamer',\\n  capabilities: ['TS', 'Directus', 'Astro']\\n});\\n```\\n\\nEnjoy the data dreaming.\\n","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"\\n# The Future of Agentic Coding\\n\\nThis is a test log entry demonstrating custom callouts.\\n\\n:::callout{type=\\"info\\"}\\nAgentic coding is the next evolution of pair programming.\\n:::\\n\\n## Key Benefits\\n\\n- Increased velocity\\n- Reduced boilerplate\\n- Intelligent refactoring\\n\\n:::callout{type=\\"warning\\"}\\nAlways review the code generated by AI agents!\\n:::\\n\\n### Code Example\\n\\n```typescript\\nconst dreamer = new Agent({\\n  mode: 'DataDreamer',\\n  capabilities: ['TS', 'Directus', 'Astro']\\n});\\n```\\n\\nEnjoy the data dreaming.\\n","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	\N	\N
34	38	directus_fields	14	{"id":14,"collection":"logs","field":"content","special":null,"interface":"input-rich-text-html","options":null,"display":"formatted-value","display_options":null,"readonly":false,"hidden":false,"sort":5,"width":"full","translations":null,"note":null,"conditions":null,"required":false,"group":null,"validation":null,"validation_message":null,"searchable":true}	{"collection":"logs","field":"content","interface":"input-rich-text-html","display":"formatted-value"}	\N	\N
35	39	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating custom callouts.</p>\\n<p>:::callout{type=\\"info\\"} Agentic coding is the next evolution of pair programming. :::&nbsp;</p>\\n<h2>Key Benefits</h2>\\n<ul>\\n<li>Increased velocity</li>\\n<li>Reduced boilerplate</li>\\n<li>Intelligent refactoring</li>\\n</ul>\\n<p>:::callout{type=\\"warning\\"} Always review the code generated by AI agents! :::</p>\\n<h3>Code Example</h3>\\n<p>```typescript const dreamer = new Agent({ mode: 'DataDreamer', capabilities: ['TS', 'Directus', 'Astro'] }); ```</p>\\n<p>Enjoy the data dreaming.</p>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating custom callouts.</p>\\n<p>:::callout{type=\\"info\\"} Agentic coding is the next evolution of pair programming. :::&nbsp;</p>\\n<h2>Key Benefits</h2>\\n<ul>\\n<li>Increased velocity</li>\\n<li>Reduced boilerplate</li>\\n<li>Intelligent refactoring</li>\\n</ul>\\n<p>:::callout{type=\\"warning\\"} Always review the code generated by AI agents! :::</p>\\n<h3>Code Example</h3>\\n<p>```typescript const dreamer = new Agent({ mode: 'DataDreamer', capabilities: ['TS', 'Directus', 'Astro'] }); ```</p>\\n<p>Enjoy the data dreaming.</p>"}	\N	\N
36	44	site_settings	1	{"status_text":"AVAILABLE FOR NEW PROJECTS","email":"hello@data-dreamer.net","github":"https://github.com/datadreamer","linkedin":"https://linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?"}	{"status_text":"AVAILABLE FOR NEW PROJECTS","email":"hello@data-dreamer.net","github":"https://github.com/datadreamer","linkedin":"https://linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?"}	\N	\N
37	45	home_settings	1	{"hero_tagline_1":"CONVERTING SIGNAL TO INTELLIGENCE.","hero_tagline_2":"FULL STACK ANALYTICS & HOMELAB OPERATIONS.","hero_tagline_3":"CURRENTLY TRAINING NEURAL NETS."}	{"hero_tagline_1":"CONVERTING SIGNAL TO INTELLIGENCE.","hero_tagline_2":"FULL STACK ANALYTICS & HOMELAB OPERATIONS.","hero_tagline_3":"CURRENTLY TRAINING NEURAL NETS."}	\N	\N
38	47	site_settings	1	{"id":1,"status_text":"AVAILABLE FOR NEW PROJECTS","email":"hello@data-dreamer.net","github":"https://github.com/datadreamer","linkedin":"https://linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?"}	{"status_text":"AVAILABLE FOR NEW PROJECTS","email":"hello@data-dreamer.net","github":"https://github.com/datadreamer","linkedin":"https://linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?"}	\N	\N
39	48	home_settings	1	{"id":1,"hero_tagline_1":"CONVERTING SIGNAL TO INTELLIGENCE.","hero_tagline_2":"FULL STACK ANALYTICS & HOMELAB OPERATIONS.","hero_tagline_3":"CURRENTLY TRAINING NEURAL NETS."}	{"hero_tagline_1":"CONVERTING SIGNAL TO INTELLIGENCE.","hero_tagline_2":"FULL STACK ANALYTICS & HOMELAB OPERATIONS.","hero_tagline_3":"CURRENTLY TRAINING NEURAL NETS."}	\N	\N
40	49	projects	1	{"id":1,"title":"Project Phoenix","slug":"project-phoenix","summary":"A revolutionary data processing engine built with Astro and Directus.","description":"\\n<h2>The Architectural Core</h2>\\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\\n<h3>Core Technology</h3>\\n<ul>\\n  <li>Distributed Graph Neural Networks</li>\\n  <li>Real-time Vector Ingestion</li>\\n  <li>Low-latency Edge Inference</li>\\n</ul>\\n            ","cover_image":null,"tags":["AI","Data Engineering","Directus"],"published_at":"2026-03-20T14:43:29.716Z","featured":true}	{"summary":"A revolutionary data processing engine built with Astro and Directus.","description":"\\n<h2>The Architectural Core</h2>\\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\\n<h3>Core Technology</h3>\\n<ul>\\n  <li>Distributed Graph Neural Networks</li>\\n  <li>Real-time Vector Ingestion</li>\\n  <li>Low-latency Edge Inference</li>\\n</ul>\\n            "}	\N	\N
41	50	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"\\n# The Future of Agentic Coding\\n\\nThe landscape of software development is undergoing a fundamental shift.\\n\\n:::info PRO TIP\\nAgentic coding is not just autocompleting lines; it's orchestrating entire workflows.\\n:::\\n\\n## The Evolution\\n\\nTraditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.\\n\\n:::warning CAUTION\\nAutonomous agents require strict validation pipelines to ensure architectural consistency.\\n:::\\n\\n### Sample Implementation\\n\\n```typescript\\ninterface AgentConfig {\\n  goal: string;\\n  constraints: string[];\\n}\\n\\nconst coder = new Agent({\\n  role: 'Architect',\\n  focus: 'Performance'\\n});\\n```\\n\\nWe are moving from \\"writing code\\" to \\"directing systems\\".\\n","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"\\n# The Future of Agentic Coding\\n\\nThe landscape of software development is undergoing a fundamental shift.\\n\\n:::info PRO TIP\\nAgentic coding is not just autocompleting lines; it's orchestrating entire workflows.\\n:::\\n\\n## The Evolution\\n\\nTraditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.\\n\\n:::warning CAUTION\\nAutonomous agents require strict validation pipelines to ensure architectural consistency.\\n:::\\n\\n### Sample Implementation\\n\\n```typescript\\ninterface AgentConfig {\\n  goal: string;\\n  constraints: string[];\\n}\\n\\nconst coder = new Agent({\\n  role: 'Architect',\\n  focus: 'Performance'\\n});\\n```\\n\\nWe are moving from \\"writing code\\" to \\"directing systems\\".\\n"}	\N	\N
84	136	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Data Dreamer","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"ec6e7eb5-0483-415d-93cd-289a9bbdad19","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":null}	{"hero_title":"Data Dreamer"}	\N	\N
42	52	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h2>The Future of Agentic Coding</h2>\\n<p>The landscape of software development is undergoing a fundamental shift.&nbsp;</p>\\n<p>:::info PRO TIP Agentic coding is not just autocompleting lines; it's orchestrating entire workflows. :::</p>\\n<h2>The Evolution</h2>\\n<p>Traditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.</p>\\n<p>:::warning CAUTION Autonomous agents require strict validation pipelines to ensure architectural consistency. :::</p>\\n<h3>Sample Implementation</h3>\\n<p>```typescript interface AgentConfig { goal: string; constraints: string[]; } const coder = new Agent({ role: 'Architect', focus: 'Performance' }); ```</p>\\n<p>We are moving from \\"writing code\\" to \\"directing systems\\".</p>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h2>The Future of Agentic Coding</h2>\\n<p>The landscape of software development is undergoing a fundamental shift.&nbsp;</p>\\n<p>:::info PRO TIP Agentic coding is not just autocompleting lines; it's orchestrating entire workflows. :::</p>\\n<h2>The Evolution</h2>\\n<p>Traditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.</p>\\n<p>:::warning CAUTION Autonomous agents require strict validation pipelines to ensure architectural consistency. :::</p>\\n<h3>Sample Implementation</h3>\\n<p>```typescript interface AgentConfig { goal: string; constraints: string[]; } const coder = new Agent({ role: 'Architect', focus: 'Performance' }); ```</p>\\n<p>We are moving from \\"writing code\\" to \\"directing systems\\".</p>"}	\N	\N
43	53	directus_files	f996d293-b639-4238-851b-ba2172517f17	{"title":"Diagram","filename_download":"diagram.png","type":"image/png","storage":"local"}	{"title":"Diagram","filename_download":"diagram.png","type":"image/png","storage":"local"}	\N	\N
44	54	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h2>The Future of Agentic Coding</h2>\\n<p>The landscape of software development is undergoing a fundamental shift.&nbsp;</p>\\n<p>:::info PRO TIP Agentic coding is not just autocompleting lines; it's orchestrating entire workflows. :::</p>\\n<h2>The Evolution</h2>\\n<p>Traditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.</p>\\n<p>:::warning CAUTION Autonomous agents require strict validation pipelines to ensure architectural consistency. :::</p>\\n<h3>Sample Implementation</h3>\\n<p>```typescript interface AgentConfig { goal: string; constraints: string[]; } const coder = new Agent({ role: 'Architect', focus: 'Performance' }); ```</p>\\n<p><img src=\\"http://localhost:8055/assets/f996d293-b639-4238-851b-ba2172517f17.png?width=349&amp;height=144\\" alt=\\"Diagram\\" loading=\\"lazy\\"></p>\\n<p>We are moving from \\"writing code\\" to \\"directing systems\\".</p>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h2>The Future of Agentic Coding</h2>\\n<p>The landscape of software development is undergoing a fundamental shift.&nbsp;</p>\\n<p>:::info PRO TIP Agentic coding is not just autocompleting lines; it's orchestrating entire workflows. :::</p>\\n<h2>The Evolution</h2>\\n<p>Traditional IDEs gave us syntax highlighting. Copilots gave us suggestions. Agents give us **solutions**.</p>\\n<p>:::warning CAUTION Autonomous agents require strict validation pipelines to ensure architectural consistency. :::</p>\\n<h3>Sample Implementation</h3>\\n<p>```typescript interface AgentConfig { goal: string; constraints: string[]; } const coder = new Agent({ role: 'Architect', focus: 'Performance' }); ```</p>\\n<p><img src=\\"http://localhost:8055/assets/f996d293-b639-4238-851b-ba2172517f17.png?width=349&amp;height=144\\" alt=\\"Diagram\\" loading=\\"lazy\\"></p>\\n<p>We are moving from \\"writing code\\" to \\"directing systems\\".</p>"}	\N	\N
45	56	site_settings	1	{"id":1,"status_text":"AVAILABLE FOR NEW PROJECTS","email":"hello@data-dreamer.net","github":"https://github.com/atefalvi","linkedin":"https://linkedin.com/in/atefsyed","footer_cta_heading":"READY TO PROCESS DATA?"}	{"github":"https://github.com/atefalvi","linkedin":"https://linkedin.com/in/atefsyed"}	\N	\N
46	63	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"\\n<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n  <li>Real-time updates via SSR</li>\\n  <li>WYSIWYG compatibility</li>\\n  <li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>\\n            ","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"\\n<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n  <li>Real-time updates via SSR</li>\\n  <li>WYSIWYG compatibility</li>\\n  <li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>\\n            "}	\N	\N
47	64	site_settings	1	{"id":1,"status_text":"SYSTEMS ONLINE (SSR ENABLED)","email":"hello@data-dreamer.net","github":"https://github.com/atefalvi","linkedin":"https://linkedin.com/in/atefsyed","footer_cta_heading":"READY TO PROCESS DATA?"}	{"status_text":"SYSTEMS ONLINE (SSR ENABLED)"}	\N	\N
48	68	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h1>The Future of Agentic Coding</h1>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>"}	\N	\N
103	172	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14","stats":[{"number":"05+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"stats":[{"number":"05+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}]}	\N	\N
49	76	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h2>The Future of Agentic Coding</h2>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h2>The Future of Agentic Coding</h2>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>"}	\N	\N
50	78	logs	2	{"title":"Designing with Brutalism","slug":"designing-brutalism","excerpt":"Exploring the philosophy behind Data Dreamer v3 aesthetic.","content":"<p>Aesthetic matters. Brutalism brings raw data to the forefront.</p>","published_at":"2026-03-20T16:49:18.129Z","tag":"Design","category":"Opinion","log_number":2,"series_label":"Design series"}	{"title":"Designing with Brutalism","slug":"designing-brutalism","excerpt":"Exploring the philosophy behind Data Dreamer v3 aesthetic.","content":"<p>Aesthetic matters. Brutalism brings raw data to the forefront.</p>","published_at":"2026-03-20T16:49:18.129Z","tag":"Design","category":"Opinion","log_number":2,"series_label":"Design series"}	\N	\N
51	79	logs	3	{"title":"Optimizing Astro for Scale","slug":"optimizing-astro","excerpt":"How to handle thousands of dynamic routes.","content":"<p>Astro provides excellent scaling capabilities, especially when paired with a good CMS.</p>","published_at":"2026-03-20T16:49:18.151Z","tag":"Architecture","category":"Tutorial","log_number":3,"series_label":"Directus series"}	{"title":"Optimizing Astro for Scale","slug":"optimizing-astro","excerpt":"How to handle thousands of dynamic routes.","content":"<p>Astro provides excellent scaling capabilities, especially when paired with a good CMS.</p>","published_at":"2026-03-20T16:49:18.151Z","tag":"Architecture","category":"Tutorial","log_number":3,"series_label":"Directus series"}	\N	\N
52	80	logs	4	{"title":"The Ultimate Component Test","slug":"ultimate-component-test","excerpt":"Testing all custom markdown components in the WYSIWYG editor.","content":"\\n<h2>Introduction</h2>\\n\\n<p>This post contains every single component we have built to ensure they all render correctly inside the WYSIWYG editor.</p>\\n\\n<p>:::info THE BASICS</p>\\n<p>This is a standard info callout. It helps draw attention to standard information.</p>\\n<p>:::</p>\\n\\n<p>:::warning CRITICAL</p>\\n<p>This is a warning callout. It should have a red/orange tint if styled, or at least be distinct.</p>\\n<p>:::</p>\\n\\n<p>:::tip HELPFUL</p>\\n<p>This is a tip callout.</p>\\n<p>:::</p>\\n\\n<p>:::note REMINDER</p>\\n<p>This is a note callout.</p>\\n<p>:::</p>\\n\\n<h2>The Pull Quote</h2>\\n\\n<p>:::quote</p>\\n<p>Agentic coding represents the largest paradigm shift since the invention of the high-level programming language.</p>\\n<p>:::</p>\\n\\n<h2>Expandable Blocks</h2>\\n\\n<p>:::details Click to reveal a secret</p>\\n<p>This content is hidden by default and requires the user to interact with the details element to expand it.</p>\\n<p>Great for hiding long logs or extra context.</p>\\n<p>:::</p>\\n\\n<h2>Images inside Markdown</h2>\\n\\n<p>Here is an image added via markdown:</p>\\n<img src=\\"https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80\\" alt=\\"Retro computer setup\\">\\n\\n<p>End of test log.</p>\\n","published_at":"2026-03-20T16:49:18.159Z","tag":"Testing","category":"QA","log_number":4}	{"title":"The Ultimate Component Test","slug":"ultimate-component-test","excerpt":"Testing all custom markdown components in the WYSIWYG editor.","content":"\\n<h2>Introduction</h2>\\n\\n<p>This post contains every single component we have built to ensure they all render correctly inside the WYSIWYG editor.</p>\\n\\n<p>:::info THE BASICS</p>\\n<p>This is a standard info callout. It helps draw attention to standard information.</p>\\n<p>:::</p>\\n\\n<p>:::warning CRITICAL</p>\\n<p>This is a warning callout. It should have a red/orange tint if styled, or at least be distinct.</p>\\n<p>:::</p>\\n\\n<p>:::tip HELPFUL</p>\\n<p>This is a tip callout.</p>\\n<p>:::</p>\\n\\n<p>:::note REMINDER</p>\\n<p>This is a note callout.</p>\\n<p>:::</p>\\n\\n<h2>The Pull Quote</h2>\\n\\n<p>:::quote</p>\\n<p>Agentic coding represents the largest paradigm shift since the invention of the high-level programming language.</p>\\n<p>:::</p>\\n\\n<h2>Expandable Blocks</h2>\\n\\n<p>:::details Click to reveal a secret</p>\\n<p>This content is hidden by default and requires the user to interact with the details element to expand it.</p>\\n<p>Great for hiding long logs or extra context.</p>\\n<p>:::</p>\\n\\n<h2>Images inside Markdown</h2>\\n\\n<p>Here is an image added via markdown:</p>\\n<img src=\\"https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80\\" alt=\\"Retro computer setup\\">\\n\\n<p>End of test log.</p>\\n","published_at":"2026-03-20T16:49:18.159Z","tag":"Testing","category":"QA","log_number":4}	\N	\N
53	82	logs	1	{"id":1,"title":"The Future of Agentic Coding","slug":"future-agentic-coding","excerpt":"How AI agents are reshaping the software development lifecycle.","content":"<h2>The Future of Agentic Coding</h2>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>\\n<h2>Key Advantages</h2>\\n<ol>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ol>","published_at":"2026-03-20T14:43:29.727Z","tag":"AI","category":"Article","log_number":1,"series_label":"Agent series"}	{"content":"<h2>The Future of Agentic Coding</h2>\\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\\n<p>:::info PRO TIP</p>\\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\\n<p>:::</p>\\n<h2>Key Advantages</h2>\\n<ul>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ul>\\n<p>:::warning CAUTION</p>\\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\\n<p>:::</p>\\n<p>End of transmission.</p>\\n<h2>Key Advantages</h2>\\n<ol>\\n<li>Real-time updates via SSR</li>\\n<li>WYSIWYG compatibility</li>\\n<li>Premium aesthetics</li>\\n</ol>"}	\N	\N
54	83	logs	2	{"id":2,"title":"Designing with Brutalism","slug":"designing-brutalism","excerpt":"Exploring the philosophy behind Data Dreamer v3 aesthetic.","content":"<p>Aesthetic matters. Brutalism brings raw data to the forefront.</p>\\n<p>| Component &nbsp; &nbsp; &nbsp; &nbsp;| Type &nbsp; &nbsp; &nbsp; &nbsp;| Description &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Example / Value &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Status &nbsp; | Notes &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>|-----------------|------------|--------------------------------------------------|------------------------------|----------|--------------------------------|<br>| Header &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Layout &nbsp; &nbsp; &nbsp;| Top navigation bar with branding &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Header /&gt;` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Fixed, global component &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Project Card &nbsp; &nbsp;| Component &nbsp; | Displays project preview with image + metadata &nbsp; | `.project-card` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uses grayscale hover &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Renderer &nbsp; | System &nbsp; &nbsp; &nbsp;| Maps CMS blocks to UI components &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Code /&gt;`, `&lt;Quote /&gt;` &nbsp; &nbsp; &nbsp;| ⚙️ WIP &nbsp; &nbsp;| Uses Directus block editor &nbsp; &nbsp; |<br>| Primary Color &nbsp; | Token &nbsp; &nbsp; &nbsp; | Main brand color &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `#FF2E00` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Used for accents/interactions &nbsp;|<br>| Font (Heading) &nbsp;| Typography &nbsp;| Heading font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `Anton` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uppercase only &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Font (Body) &nbsp; &nbsp; | Typography &nbsp;| Body font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| `JetBrains Mono` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Developer-style text &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Cursor Effect &nbsp; | Interaction | Global trailing mouse halo &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | Canvas-based &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ⚙️ WIP &nbsp; &nbsp;| Must not flicker &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Page &nbsp; &nbsp; &nbsp; | Page &nbsp; &nbsp; &nbsp; &nbsp;| Blog detail view &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `/blog/[slug]` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | 🚧 Draft &nbsp;| Includes sidebar &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| API Endpoint &nbsp; &nbsp;| Backend &nbsp; &nbsp; | CMS endpoint &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `http://localhost:8055` &nbsp; &nbsp; &nbsp;| ✅ Active | Directus instance &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Docs Link &nbsp; &nbsp; &nbsp; | Reference &nbsp; | External documentation &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | [Directus Docs](https://directus.io/docs) | 📎 Link &nbsp; | Useful for SDK usage &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |</p>","published_at":"2026-03-20T16:49:18.129Z","tag":"Design","category":"Opinion","log_number":2,"series_label":"Design series"}	{"content":"<p>Aesthetic matters. Brutalism brings raw data to the forefront.</p>\\n<p>| Component &nbsp; &nbsp; &nbsp; &nbsp;| Type &nbsp; &nbsp; &nbsp; &nbsp;| Description &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Example / Value &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Status &nbsp; | Notes &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>|-----------------|------------|--------------------------------------------------|------------------------------|----------|--------------------------------|<br>| Header &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Layout &nbsp; &nbsp; &nbsp;| Top navigation bar with branding &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Header /&gt;` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Fixed, global component &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Project Card &nbsp; &nbsp;| Component &nbsp; | Displays project preview with image + metadata &nbsp; | `.project-card` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uses grayscale hover &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Renderer &nbsp; | System &nbsp; &nbsp; &nbsp;| Maps CMS blocks to UI components &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Code /&gt;`, `&lt;Quote /&gt;` &nbsp; &nbsp; &nbsp;| ⚙️ WIP &nbsp; &nbsp;| Uses Directus block editor &nbsp; &nbsp; |<br>| Primary Color &nbsp; | Token &nbsp; &nbsp; &nbsp; | Main brand color &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `#FF2E00` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Used for accents/interactions &nbsp;|<br>| Font (Heading) &nbsp;| Typography &nbsp;| Heading font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `Anton` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uppercase only &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Font (Body) &nbsp; &nbsp; | Typography &nbsp;| Body font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| `JetBrains Mono` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Developer-style text &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Cursor Effect &nbsp; | Interaction | Global trailing mouse halo &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | Canvas-based &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ⚙️ WIP &nbsp; &nbsp;| Must not flicker &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Page &nbsp; &nbsp; &nbsp; | Page &nbsp; &nbsp; &nbsp; &nbsp;| Blog detail view &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `/blog/[slug]` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | 🚧 Draft &nbsp;| Includes sidebar &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| API Endpoint &nbsp; &nbsp;| Backend &nbsp; &nbsp; | CMS endpoint &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `http://localhost:8055` &nbsp; &nbsp; &nbsp;| ✅ Active | Directus instance &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Docs Link &nbsp; &nbsp; &nbsp; | Reference &nbsp; | External documentation &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | [Directus Docs](https://directus.io/docs) | 📎 Link &nbsp; | Useful for SDK usage &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |</p>"}	\N	\N
55	85	directus_fields	6	{"id":6,"collection":"projects","field":"cover_image","special":null,"interface":"file-image","options":null,"display":"image","display_options":null,"readonly":false,"hidden":false,"sort":6,"width":"full","translations":null,"note":null,"conditions":null,"required":false,"group":null,"validation":null,"validation_message":null,"searchable":true}	{"collection":"projects","field":"cover_image","interface":"file-image","display":"image"}	\N	\N
122	194	directus_permissions	7	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}	123	\N
56	86	logs	5	{"title":"Structured Complexity","slug":"structured-complexity-tables","excerpt":"Organizing data efficiently using Markdown tables in a Brutalist aesthetic.","content":"\\n<h2>Why Tables Matter</h2>\\n\\n<p>When presenting complex analytical data, plain text is not enough. We need structured, rigid, brutalist tables.</p>\\n\\n<p>Here is an example of a system performance report:</p>\\n\\n| Component | Status | Latency (ms) | Notes |\\n| :--- | :---: | :---: | :--- |\\n| **API Gateway** | <span style=\\"color:#00ff87\\">Online</span> | 42 | Operating normally. |\\n| **Directus DB** | <span style=\\"color:#00ff87\\">Online</span> | 18 | Indexed queries optimized. |\\n| **Astro SSR** | <span style=\\"color:var(--color-primary)\\">Warning</span> | 150 | High load detected. |\\n| **Worker Node** | <span style=\\"color:#0088ff\\">Idle</span> | 5 | Waiting for tasks. |\\n\\n<h2>Model Comparison</h2>\\n\\n| Model | Parameters | Context Window | Best For |\\n| :--- | :---: | :---: | :--- |\\n| Claude 3.5 Sonnet | N/A | 200k | Agentic coding, complex reasoning |\\n| GPT-4o | N/A | 128k | Multimodal tasks, swift responses |\\n| Llama 3 (8B) | 8B | 8k | Local execution, lightweight scripting |\\n| Mistral Large | N/A | 32k | General purpose enterprise logic |\\n\\n<p>:::tip Formatting</p>\\n<p>Markdown tables are fully supported. You can align columns using colons in the header divider row!</p>\\n<p>:::</p>\\n","published_at":"2026-03-20T17:04:18.244Z","tag":"Data","category":"Tutorial","log_number":5,"series_label":"Formatting Guides"}	{"title":"Structured Complexity","slug":"structured-complexity-tables","excerpt":"Organizing data efficiently using Markdown tables in a Brutalist aesthetic.","content":"\\n<h2>Why Tables Matter</h2>\\n\\n<p>When presenting complex analytical data, plain text is not enough. We need structured, rigid, brutalist tables.</p>\\n\\n<p>Here is an example of a system performance report:</p>\\n\\n| Component | Status | Latency (ms) | Notes |\\n| :--- | :---: | :---: | :--- |\\n| **API Gateway** | <span style=\\"color:#00ff87\\">Online</span> | 42 | Operating normally. |\\n| **Directus DB** | <span style=\\"color:#00ff87\\">Online</span> | 18 | Indexed queries optimized. |\\n| **Astro SSR** | <span style=\\"color:var(--color-primary)\\">Warning</span> | 150 | High load detected. |\\n| **Worker Node** | <span style=\\"color:#0088ff\\">Idle</span> | 5 | Waiting for tasks. |\\n\\n<h2>Model Comparison</h2>\\n\\n| Model | Parameters | Context Window | Best For |\\n| :--- | :---: | :---: | :--- |\\n| Claude 3.5 Sonnet | N/A | 200k | Agentic coding, complex reasoning |\\n| GPT-4o | N/A | 128k | Multimodal tasks, swift responses |\\n| Llama 3 (8B) | 8B | 8k | Local execution, lightweight scripting |\\n| Mistral Large | N/A | 32k | General purpose enterprise logic |\\n\\n<p>:::tip Formatting</p>\\n<p>Markdown tables are fully supported. You can align columns using colons in the header divider row!</p>\\n<p>:::</p>\\n","published_at":"2026-03-20T17:04:18.244Z","tag":"Data","category":"Tutorial","log_number":5,"series_label":"Formatting Guides"}	\N	\N
57	88	directus_files	6491c577-8815-410e-bfd6-f357a97ac186	{"title":"Digital Phoenix Rising Stockcake","filename_download":"digital-phoenix-rising-stockcake.webp","type":"image/webp","storage":"local"}	{"title":"Digital Phoenix Rising Stockcake","filename_download":"digital-phoenix-rising-stockcake.webp","type":"image/webp","storage":"local"}	\N	\N
58	89	projects	1	{"id":1,"title":"Project Phoenix","slug":"project-phoenix","summary":"A revolutionary data processing engine built with Astro and Directus.","description":"\\n<h2>The Architectural Core</h2>\\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\\n<h3>Core Technology</h3>\\n<ul>\\n  <li>Distributed Graph Neural Networks</li>\\n  <li>Real-time Vector Ingestion</li>\\n  <li>Low-latency Edge Inference</li>\\n</ul>\\n            ","cover_image":"6491c577-8815-410e-bfd6-f357a97ac186","tags":["AI","Data Engineering","Directus"],"published_at":"2026-03-20T14:43:29.716Z","featured":true}	{"cover_image":"6491c577-8815-410e-bfd6-f357a97ac186"}	\N	\N
59	90	projects	1	{"id":1,"title":"Project Phoenix","slug":"project-phoenix","summary":"A revolutionary data processing engine built with Astro and Directus.","description":"<h2>The Architectural Core</h2>\\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\\n<h3>Core Technology</h3>\\n<ul>\\n<li>Distributed Graph Neural Networks</li>\\n<li>Real-time Vector Ingestion</li>\\n<li>Low-latency Edge Inference</li>\\n</ul>\\n<p>:::tip This is Tip</p>\\n<p>This is a helpful tip</p>\\n<p>:::</p>\\n<p>&nbsp;</p>","cover_image":"6491c577-8815-410e-bfd6-f357a97ac186","tags":["AI","Data Engineering","Directus"],"published_at":"2026-03-20T14:43:29.716Z","featured":true}	{"description":"<h2>The Architectural Core</h2>\\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\\n<h3>Core Technology</h3>\\n<ul>\\n<li>Distributed Graph Neural Networks</li>\\n<li>Real-time Vector Ingestion</li>\\n<li>Low-latency Edge Inference</li>\\n</ul>\\n<p>:::tip This is Tip</p>\\n<p>This is a helpful tip</p>\\n<p>:::</p>\\n<p>&nbsp;</p>"}	\N	\N
60	94	directus_fields	22	{"sort":2,"interface":"input","display":"raw","collection":"site_settings","field":"twitter"}	{"sort":2,"interface":"input","display":"raw","collection":"site_settings","field":"twitter"}	\N	\N
61	95	directus_fields	23	{"sort":1,"interface":"input","field":"hero_tagline","collection":"about"}	{"sort":1,"interface":"input","field":"hero_tagline","collection":"about"}	\N	\N
62	96	directus_fields	24	{"sort":2,"interface":"input","field":"hero_title","collection":"about"}	{"sort":2,"interface":"input","field":"hero_title","collection":"about"}	\N	\N
63	97	directus_fields	25	{"sort":3,"interface":"input-multiline","field":"hero_description","collection":"about"}	{"sort":3,"interface":"input-multiline","field":"hero_description","collection":"about"}	\N	\N
64	98	directus_fields	26	{"sort":4,"interface":"file-image","display":"image","field":"profile_image","collection":"about"}	{"sort":4,"interface":"file-image","display":"image","field":"profile_image","collection":"about"}	\N	\N
65	99	directus_fields	27	{"sort":5,"interface":"list","note":"Array of objects: {\\"number\\": \\"42\\", \\"label\\": \\"Production models\\"}","field":"stats","collection":"about","special":["cast-json"]}	{"sort":5,"interface":"list","note":"Array of objects: {\\"number\\": \\"42\\", \\"label\\": \\"Production models\\"}","field":"stats","collection":"about","special":["cast-json"]}	\N	\N
66	100	directus_fields	28	{"sort":6,"interface":"list","note":"Array of objects: {\\"date\\": \\"2021—PRES\\", \\"title\\": \\"SENIOR DATA ANALYST\\", \\"subtitle\\": \\"NEURAL SYSTEMS INC.\\", \\"tag\\": \\"FULL-TIME\\"}","field":"experience","collection":"about","special":["cast-json"]}	{"sort":6,"interface":"list","note":"Array of objects: {\\"date\\": \\"2021—PRES\\", \\"title\\": \\"SENIOR DATA ANALYST\\", \\"subtitle\\": \\"NEURAL SYSTEMS INC.\\", \\"tag\\": \\"FULL-TIME\\"}","field":"experience","collection":"about","special":["cast-json"]}	\N	\N
67	101	directus_fields	29	{"sort":7,"interface":"list","note":"Array of objects: {\\"header\\": \\"01 // CORE\\", \\"name\\": \\"DATA ANALYSIS\\", \\"items\\": [{\\"name\\": \\"PYTHON\\", \\"suffix\\": \\"V3.11\\"}]}","field":"skills","collection":"about","special":["cast-json"]}	{"sort":7,"interface":"list","note":"Array of objects: {\\"header\\": \\"01 // CORE\\", \\"name\\": \\"DATA ANALYSIS\\", \\"items\\": [{\\"name\\": \\"PYTHON\\", \\"suffix\\": \\"V3.11\\"}]}","field":"skills","collection":"about","special":["cast-json"]}	\N	\N
68	102	directus_fields	30	{"sort":8,"interface":"input-multiline","field":"contact_text","collection":"about"}	{"sort":8,"interface":"input-multiline","field":"contact_text","collection":"about"}	\N	\N
69	103	directus_collections	about	{"singleton":true,"icon":"person","note":"Global settings for the unified About page.","collection":"about"}	{"singleton":true,"icon":"person","note":"Global settings for the unified About page.","collection":"about"}	\N	\N
70	104	site_settings	1	{"id":1,"status_text":"SYSTEMS ONLINE (SSR ENABLED)","email":"hello@data-dreamer.net","github":"github.com/datadreamer","linkedin":"linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?","twitter":"twitter.com/data_dreamer"}	{"email":"hello@data-dreamer.net","github":"github.com/datadreamer","linkedin":"linkedin.com/in/datadreamer","footer_cta_heading":"READY TO PROCESS DATA?","twitter":"twitter.com/data_dreamer"}	\N	\N
71	105	about	1	{"hero_tagline":"// IDENTIFICATION: JD-0492","hero_title":"SYSTEMS ANALYST","hero_description":"Converting raw signal into actionable intelligence. Specializing in full-stack analytics, predictive modeling, and homelab operations. Passionate about bridging the gap between complex datasets and strategic decision-making through rigorous methodology and automated pipelines.","profile_image":null,"stats":[{"number":"05+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 // CORE","name":"DATA ANALYSIS","items":[{"name":"PYTHON","suffix":"V3.11"},{"name":"SQL","suffix":"ADVANCED"},{"name":"TABLEAU","suffix":"CERTIFIED"},{"name":"PANDAS/NUMPY","suffix":"NATIVE"}]},{"header":"02 // FUTURE","name":"ARTIFICIAL INTELLIGENCE","items":[{"name":"PYTORCH","suffix":"LEARNING"},{"name":"LLM TUNING","suffix":"LLAMA-2"},{"name":"RAG PIPELINES","suffix":"ACTIVE"},{"name":"COMPUTER VISION","suffix":"OPENCV"}]},{"header":"03 // INFRA","name":"HOMELAB OPS","items":[{"name":"PROXMOX","suffix":"CLUSTER"},{"name":"DOCKER","suffix":"CONTAINERS"},{"name":"UBUNTU SERVER","suffix":"LTS"},{"name":"TRUE NAS","suffix":"STORAGE"}]}],"contact_text":"Open for freelance, full-time roles, and collaborations. Response time: 24-48 hours."}	{"hero_tagline":"// IDENTIFICATION: JD-0492","hero_title":"SYSTEMS ANALYST","hero_description":"Converting raw signal into actionable intelligence. Specializing in full-stack analytics, predictive modeling, and homelab operations. Passionate about bridging the gap between complex datasets and strategic decision-making through rigorous methodology and automated pipelines.","profile_image":null,"stats":[{"number":"05+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 // CORE","name":"DATA ANALYSIS","items":[{"name":"PYTHON","suffix":"V3.11"},{"name":"SQL","suffix":"ADVANCED"},{"name":"TABLEAU","suffix":"CERTIFIED"},{"name":"PANDAS/NUMPY","suffix":"NATIVE"}]},{"header":"02 // FUTURE","name":"ARTIFICIAL INTELLIGENCE","items":[{"name":"PYTORCH","suffix":"LEARNING"},{"name":"LLM TUNING","suffix":"LLAMA-2"},{"name":"RAG PIPELINES","suffix":"ACTIVE"},{"name":"COMPUTER VISION","suffix":"OPENCV"}]},{"header":"03 // INFRA","name":"HOMELAB OPS","items":[{"name":"PROXMOX","suffix":"CLUSTER"},{"name":"DOCKER","suffix":"CONTAINERS"},{"name":"UBUNTU SERVER","suffix":"LTS"},{"name":"TRUE NAS","suffix":"STORAGE"}]}],"contact_text":"Open for freelance, full-time roles, and collaborations. Response time: 24-48 hours."}	\N	\N
72	109	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: JD-0492","hero_title":"Data Dreamer","hero_description":"Converting raw signal into actionable intelligence. Specializing in full-stack analytics, predictive modeling, and homelab operations. Passionate about bridging the gap between complex datasets and strategic decision-making through rigorous methodology and automated pipelines.","profile_image":null,"stats":[{"number":"05+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 // CORE","name":"DATA ANALYSIS","items":[{"name":"PYTHON","suffix":"V3.11"},{"name":"SQL","suffix":"ADVANCED"},{"name":"TABLEAU","suffix":"CERTIFIED"},{"name":"PANDAS/NUMPY","suffix":"NATIVE"}]},{"header":"02 // FUTURE","name":"ARTIFICIAL INTELLIGENCE","items":[{"name":"PYTORCH","suffix":"LEARNING"},{"name":"LLM TUNING","suffix":"LLAMA-2"},{"name":"RAG PIPELINES","suffix":"ACTIVE"},{"name":"COMPUTER VISION","suffix":"OPENCV"}]},{"header":"03 // INFRA","name":"HOMELAB OPS","items":[{"name":"PROXMOX","suffix":"CLUSTER"},{"name":"DOCKER","suffix":"CONTAINERS"},{"name":"UBUNTU SERVER","suffix":"LTS"},{"name":"TRUE NAS","suffix":"STORAGE"}]}],"contact_text":"Open for freelance, full-time roles, and collaborations. Response time: 24-48 hours."}	{"hero_title":"Data Dreamer"}	\N	\N
73	111	directus_fields	31	{"sort":9,"interface":"file","display":"file","collection":"about","field":"resume"}	{"sort":9,"interface":"file","display":"file","collection":"about","field":"resume"}	\N	\N
74	112	directus_fields	32	{"sort":1,"interface":"input","field":"sort","collection":"about_companies"}	{"sort":1,"interface":"input","field":"sort","collection":"about_companies"}	\N	\N
75	113	directus_fields	33	{"sort":2,"interface":"input","field":"name","collection":"about_companies"}	{"sort":2,"interface":"input","field":"name","collection":"about_companies"}	\N	\N
76	114	directus_fields	34	{"sort":3,"interface":"file-image","display":"image","field":"logo","collection":"about_companies"}	{"sort":3,"interface":"file-image","display":"image","field":"logo","collection":"about_companies"}	\N	\N
77	115	directus_collections	about_companies	{"icon":"business","note":"Companies you have worked with or for, displayed via logo carousel.","collection":"about_companies"}	{"icon":"business","note":"Companies you have worked with or for, displayed via logo carousel.","collection":"about_companies"}	\N	\N
78	126	directus_fields	35	{"sort":1,"interface":"input","field":"sort","collection":"about_companies"}	{"sort":1,"interface":"input","field":"sort","collection":"about_companies"}	\N	\N
79	127	directus_collections	about_companies	{"hidden":true,"collection":"about_companies"}	{"hidden":true,"collection":"about_companies"}	\N	\N
80	128	directus_fields	36	{"sort":10,"interface":"files","display":"related-values","collection":"about","field":"companies"}	{"sort":10,"interface":"files","display":"related-values","collection":"about","field":"companies"}	\N	\N
81	133	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":null,"stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":null}	{"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}]}	\N	\N
82	134	directus_files	ec6e7eb5-0483-415d-93cd-289a9bbdad19	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	\N	\N
83	135	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"ec6e7eb5-0483-415d-93cd-289a9bbdad19","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":null}	{"profile_image":"ec6e7eb5-0483-415d-93cd-289a9bbdad19"}	\N	\N
85	139	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"ec6e7eb5-0483-415d-93cd-289a9bbdad19","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":null}	{"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi"}	\N	\N
86	143	directus_files	30e08566-6207-4e96-bcfb-8516d883eedc	{"title":"Syed Atef Alvi Resume 2023","filename_download":"Syed_Atef_Alvi_Resume_2023.pdf","type":"application/pdf","storage":"local"}	{"title":"Syed Atef Alvi Resume 2023","filename_download":"Syed_Atef_Alvi_Resume_2023.pdf","type":"application/pdf","storage":"local"}	\N	\N
87	144	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"ec6e7eb5-0483-415d-93cd-289a9bbdad19","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	\N	\N
88	146	directus_files	e1f01874-f00a-4770-85fd-8e4c942d5073	{"title":"Profile Glitch","filename_download":"profile_glitch_1774141564571.png","type":"application/octet-stream","storage":"local"}	{"title":"Profile Glitch","filename_download":"profile_glitch_1774141564571.png","type":"application/octet-stream","storage":"local"}	\N	\N
89	147	directus_files	14d306d4-3af4-4e46-b73b-3d82009eaa9b	{"title":"Alphabet Logo","filename_download":"logo_alphabet_1774141582132.png","type":"application/octet-stream","storage":"local"}	{"title":"Alphabet Logo","filename_download":"logo_alphabet_1774141582132.png","type":"application/octet-stream","storage":"local"}	\N	\N
90	148	directus_files	affcf61a-78e7-469b-a5e3-f5374b188fe3	{"title":"Stripe Logo","filename_download":"logo_stripe_1774141591938.png","type":"application/octet-stream","storage":"local"}	{"title":"Stripe Logo","filename_download":"logo_stripe_1774141591938.png","type":"application/octet-stream","storage":"local"}	\N	\N
91	149	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"e1f01874-f00a-4770-85fd-8e4c942d5073","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"profile_image":"e1f01874-f00a-4770-85fd-8e4c942d5073"}	\N	\N
92	153	directus_files	72978994-ba68-4ce1-ac38-844267b4bb1d	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	\N	\N
93	154	directus_files	893fb9e0-301e-4ec5-8061-83dc93710813	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	\N	\N
94	155	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"893fb9e0-301e-4ec5-8061-83dc93710813","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"profile_image":"893fb9e0-301e-4ec5-8061-83dc93710813"}	\N	\N
95	159	directus_files	f53cd922-44a4-403c-b56e-7f98af3578b3	{"title":"Profile","filename_download":"profile.png","type":"image/png","storage":"local"}	{"title":"Profile","filename_download":"profile.png","type":"image/png","storage":"local"}	\N	\N
96	160	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"f53cd922-44a4-403c-b56e-7f98af3578b3","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"profile_image":"f53cd922-44a4-403c-b56e-7f98af3578b3"}	\N	\N
97	165	directus_permissions	1	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","collection":"directus_files","action":"read","permissions":{},"validation":{}}	{"policy":"abf8a154-5b1c-4a46-ac9c-7300570f4f17","collection":"directus_files","action":"read","permissions":{},"validation":{}}	\N	\N
98	166	directus_files	62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	\N	\N
99	167	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14","stats":[{"number":"8+","label":"Years building production AI pipelines and data systems"},{"number":"40+","label":"Models trained, fine-tuned, and deployed across industries"},{"number":"∞","label":"Curiosity for what comes next in agentic computing"}],"experience":[{"date":"2023 – NOW","title":"AI Systems Lead","subtitle":"DataDreamer Labs – Remote","tag":"AI OPS"},{"date":"2021 – 2023","title":"Senior Data Engineer","subtitle":"Insight Health – Toronto, ON","tag":"DATA"},{"date":"2019 – 2021","title":"ML Engineer","subtitle":"Clearwater Analytics – Boise, ID","tag":"ML"},{"date":"2017 – 2019","title":"Data Analyst","subtitle":"Pythian – Ottawa, ON","tag":"ANALYTICS"},{"date":"2015 – 2017","title":"Systems Consultant","subtitle":"EY – Toronto, ON","tag":"CONSULTING"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"profile_image":"62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14"}	\N	\N
100	169	directus_fields	27	{"id":27,"collection":"about","field":"stats","special":["cast-json"],"interface":"list","options":{"fields":[{"field":"number","type":"string","name":"Number","meta":{"interface":"input","width":"half"}},{"field":"label","type":"string","name":"Label","meta":{"interface":"input","width":"half"}}]},"display":null,"display_options":null,"readonly":false,"hidden":false,"sort":5,"width":"full","translations":null,"note":"Array of objects: {\\"number\\": \\"42\\", \\"label\\": \\"Production models\\"}","conditions":null,"required":false,"group":null,"validation":null,"validation_message":null,"searchable":true}	{"collection":"about","field":"stats","interface":"list","options":{"fields":[{"field":"number","type":"string","name":"Number","meta":{"interface":"input","width":"half"}},{"field":"label","type":"string","name":"Label","meta":{"interface":"input","width":"half"}}]}}	\N	\N
101	170	directus_fields	28	{"id":28,"collection":"about","field":"experience","special":["cast-json"],"interface":"list","options":{"fields":[{"field":"date","type":"string","name":"Date Range","meta":{"interface":"input","width":"half"}},{"field":"tag","type":"string","name":"Tag","meta":{"interface":"input","width":"half"}},{"field":"title","type":"string","name":"Title","meta":{"interface":"input","width":"full"}},{"field":"subtitle","type":"string","name":"Subtitle","meta":{"interface":"input","width":"full"}}]},"display":null,"display_options":null,"readonly":false,"hidden":false,"sort":6,"width":"full","translations":null,"note":"Array of objects: {\\"date\\": \\"2021—PRES\\", \\"title\\": \\"SENIOR DATA ANALYST\\", \\"subtitle\\": \\"NEURAL SYSTEMS INC.\\", \\"tag\\": \\"FULL-TIME\\"}","conditions":null,"required":false,"group":null,"validation":null,"validation_message":null,"searchable":true}	{"collection":"about","field":"experience","interface":"list","options":{"fields":[{"field":"date","type":"string","name":"Date Range","meta":{"interface":"input","width":"half"}},{"field":"tag","type":"string","name":"Tag","meta":{"interface":"input","width":"half"}},{"field":"title","type":"string","name":"Title","meta":{"interface":"input","width":"full"}},{"field":"subtitle","type":"string","name":"Subtitle","meta":{"interface":"input","width":"full"}}]}}	\N	\N
102	171	directus_fields	29	{"id":29,"collection":"about","field":"skills","special":["cast-json"],"interface":"list","options":{"fields":[{"field":"header","type":"string","name":"Header (e.g. 01 / CORE)","meta":{"interface":"input","width":"half"}},{"field":"name","type":"string","name":"Category Name","meta":{"interface":"input","width":"half"}},{"field":"items","type":"json","name":"Skill Items","meta":{"interface":"list","options":{"fields":[{"field":"name","type":"string","name":"Skill Name","meta":{"interface":"input","width":"half"}},{"field":"suffix","type":"string","name":"Level (PRO/ADV)","meta":{"interface":"input","width":"half"}}]}}}]},"display":null,"display_options":null,"readonly":false,"hidden":false,"sort":7,"width":"full","translations":null,"note":"Array of objects: {\\"header\\": \\"01 // CORE\\", \\"name\\": \\"DATA ANALYSIS\\", \\"items\\": [{\\"name\\": \\"PYTHON\\", \\"suffix\\": \\"V3.11\\"}]}","conditions":null,"required":false,"group":null,"validation":null,"validation_message":null,"searchable":true}	{"collection":"about","field":"skills","interface":"list","options":{"fields":[{"field":"header","type":"string","name":"Header (e.g. 01 / CORE)","meta":{"interface":"input","width":"half"}},{"field":"name","type":"string","name":"Category Name","meta":{"interface":"input","width":"half"}},{"field":"items","type":"json","name":"Skill Items","meta":{"interface":"list","options":{"fields":[{"field":"name","type":"string","name":"Skill Name","meta":{"interface":"input","width":"half"}},{"field":"suffix","type":"string","name":"Level (PRO/ADV)","meta":{"interface":"input","width":"half"}}]}}}]}}	\N	\N
104	174	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14","stats":[{"number":"08+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI & ML","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"stats":[{"number":"08+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}]}	\N	\N
105	175	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"62d4bc0c-ef90-4d4e-b6d7-bbce3c84ed14","stats":[{"number":"08+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"skills":[{"header":"01 / INTELLIGENCE","name":"AI","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}]}	\N	\N
106	176	directus_files	8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d	{"title":"Profile","filename_download":"profile.png","type":"image/png","storage":"local"}	{"title":"Profile","filename_download":"profile.png","type":"image/png","storage":"local"}	\N	\N
107	177	about	1	{"id":1,"hero_tagline":"// IDENTIFICATION: AI ENGINEER","hero_title":"Atef Alvi","hero_description":"I architect agentic systems, intelligent pipelines, and data-driven products at the intersection of AI, infrastructure, and human impact. I believe the next frontier of software is systems that think.","profile_image":"8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d","stats":[{"number":"08+","label":"Years of experience in data operations and engineering"},{"number":"42","label":"Production models and automation pipelines deployed"},{"number":"01","label":"Singular focus: extracting definitive signal from absolute noise"}],"experience":[{"date":"2021—PRES","title":"SENIOR DATA ANALYST","subtitle":"NEURAL SYSTEMS INC. // REMOTE","tag":"FULL-TIME"},{"date":"2019—2021","title":"DATA ENGINEER II","subtitle":"QUANTUM LOGISTICS // NEW YORK, NY","tag":"FULL-TIME"},{"date":"2017—2019","title":"JUNIOR ANALYST","subtitle":"DATA DYNAMICS // BOSTON, MA","tag":"FULL-TIME"},{"date":"2013—2017","title":"B.S. COMPUTER SCIENCE","subtitle":"MASSACHUSETTS INSTITUTE OF TECHNOLOGY","tag":"EDUCATION"}],"skills":[{"header":"01 / INTELLIGENCE","name":"AI","items":[{"name":"LLM Fine-Tuning","suffix":"PRO"},{"name":"Agentic Systems","suffix":"PRO"},{"name":"RAG Pipelines","suffix":"PRO"},{"name":"Computer Vision","suffix":"ADV"},{"name":"Reinforcement Learning","suffix":"INT"}]},{"header":"02 / INFRASTRUCTURE","name":"SYSTEMS","items":[{"name":"Python / FastAPI","suffix":"PRO"},{"name":"Docker / K8s","suffix":"PRO"},{"name":"AWS / GCP","suffix":"ADV"},{"name":"PostgreSQL","suffix":"PRO"},{"name":"Airflow / Spark","suffix":"ADV"}]},{"header":"03 / PRODUCT","name":"CRAFT","items":[{"name":"System Architecture","suffix":"PRO"},{"name":"API Design","suffix":"PRO"},{"name":"Astro / Next.js","suffix":"ADV"},{"name":"TypeScript","suffix":"ADV"},{"name":"Directus CMS","suffix":"PRO"}]}],"resume":"30e08566-6207-4e96-bcfb-8516d883eedc"}	{"profile_image":"8d024edb-4d0a-4ea9-ae1a-fd12a73fa92d"}	\N	\N
108	179	site_settings	1	{"id":1,"status_text":"SYSTEMS ONLINE (SSR ENABLED)","email":"hello@data-dreamer.net","github":"github.com/atefalvi","linkedin":"linkedin.com/in/syedatef","footer_cta_heading":"READY TO PROCESS DATA?","twitter":"twitter.com/data_dreamer"}	{"github":"github.com/atefalvi","linkedin":"linkedin.com/in/syedatef"}	\N	\N
109	180	directus_users	210c2d58-f85a-4f9f-a333-3230b096a70c	{"first_name":"Agent","last_name":"Clerk","email":"atefsagent@gmail.com","password":"**********","language":"en-CA"}	{"first_name":"Agent","last_name":"Clerk","email":"atefsagent@gmail.com","password":"**********","language":"en-CA"}	\N	\N
110	181	directus_files	135423d8-e08d-46cd-b1ce-2189d53efa46	{"title":"Test1 Circle","filename_download":"test1 circle.png","type":"image/png","storage":"local"}	{"title":"Test1 Circle","filename_download":"test1 circle.png","type":"image/png","storage":"local"}	\N	\N
111	182	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	{"id":"b33b41c7-4075-4a71-94ca-20bc6ebfc634","first_name":"Admin","last_name":"User","email":"atefalvi@gmail.com","password":"**********","location":null,"title":null,"description":null,"tags":null,"avatar":"135423d8-e08d-46cd-b1ce-2189d53efa46","language":null,"tfa_secret":null,"status":"active","role":"468a5eff-ce7f-4ecf-848f-f1ae8c549d20","token":null,"last_access":"2026-03-22T02:29:33.586Z","last_page":"/users/b33b41c7-4075-4a71-94ca-20bc6ebfc634","provider":"default","external_identifier":null,"auth_data":null,"email_notifications":true,"appearance":null,"theme_dark":null,"theme_light":null,"theme_light_overrides":null,"theme_dark_overrides":null,"text_direction":"auto","policies":[]}	{"avatar":"135423d8-e08d-46cd-b1ce-2189d53efa46"}	\N	\N
112	183	directus_files	69291d43-21d7-423e-9055-921330fe0b16	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	{"title":"Syed Profile Picture 1","filename_download":"syed_profile_picture_1.JPG","type":"image/jpeg","storage":"local"}	\N	\N
114	185	directus_roles	1a517210-06bd-4ba9-b549-491374a650f3	{"name":"Agent"}	{"name":"Agent"}	\N	\N
113	184	directus_users	b33b41c7-4075-4a71-94ca-20bc6ebfc634	{"id":"b33b41c7-4075-4a71-94ca-20bc6ebfc634","first_name":"Admin","last_name":"User","email":"atefalvi@gmail.com","password":"**********","location":null,"title":null,"description":null,"tags":null,"avatar":"69291d43-21d7-423e-9055-921330fe0b16","language":null,"tfa_secret":null,"status":"active","role":"468a5eff-ce7f-4ecf-848f-f1ae8c549d20","token":null,"last_access":"2026-03-22T02:29:33.586Z","last_page":"/users/b33b41c7-4075-4a71-94ca-20bc6ebfc634","provider":"default","external_identifier":null,"auth_data":null,"email_notifications":true,"appearance":null,"theme_dark":null,"theme_light":null,"theme_light_overrides":null,"theme_dark_overrides":null,"text_direction":"auto","policies":[]}	{"avatar":"69291d43-21d7-423e-9055-921330fe0b16"}	\N	\N
115	186	directus_roles	1a517210-06bd-4ba9-b549-491374a650f3	{"id":"1a517210-06bd-4ba9-b549-491374a650f3","name":"Agent","icon":"robot_2","description":null,"parent":null,"children":[],"policies":[],"users":[]}	{"icon":"robot_2"}	\N	\N
116	188	directus_access	a75e11ac-612f-40ee-a843-f91b7434b057	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}	123	\N
117	189	directus_permissions	2	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"}	123	\N
118	190	directus_permissions	3	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"}	123	\N
119	191	directus_permissions	4	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"}	123	\N
120	192	directus_permissions	5	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"}	123	\N
121	193	directus_permissions	6	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"}	{"policy":"4ec5e347-7def-4052-808c-5f68c946fd38","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"}	123	\N
124	196	directus_access	57c4f254-3b51-4f2e-81c2-1ec7fb35fa15	{"policy":{"name":"Agent Clerk - Blog Writer","permissions":{"create":[{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}],"update":[],"delete":[]},"app_access":true,"roles":{"create":[{"policy":"+","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}],"update":[],"delete":[]}},"sort":1,"role":"1a517210-06bd-4ba9-b549-491374a650f3"}	{"policy":{"name":"Agent Clerk - Blog Writer","permissions":{"create":[{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}],"update":[],"delete":[]},"app_access":true,"roles":{"create":[{"policy":"+","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}],"update":[],"delete":[]}},"sort":1,"role":"1a517210-06bd-4ba9-b549-491374a650f3"}	\N	\N
123	195	directus_policies	4ec5e347-7def-4052-808c-5f68c946fd38	{"name":"Agent Clerk - Blog Writer","permissions":{"create":[{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}],"update":[],"delete":[]},"app_access":true,"roles":{"create":[{"policy":"+","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}],"update":[],"delete":[]}}	{"name":"Agent Clerk - Blog Writer","permissions":{"create":[{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"read"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"update"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"logs","action":"share"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"create"},{"policy":"+","permissions":null,"validation":null,"fields":["*"],"presets":null,"collection":"directus_files","action":"read"}],"update":[],"delete":[]},"app_access":true,"roles":{"create":[{"policy":"+","role":{"id":"1a517210-06bd-4ba9-b549-491374a650f3"}}],"update":[],"delete":[]}}	124	\N
125	197	directus_users	210c2d58-f85a-4f9f-a333-3230b096a70c	{"id":"210c2d58-f85a-4f9f-a333-3230b096a70c","first_name":"Agent","last_name":"Clerk","email":"atefsagent@gmail.com","password":"**********","location":null,"title":null,"description":null,"tags":null,"avatar":null,"language":"en-CA","tfa_secret":null,"status":"active","role":"1a517210-06bd-4ba9-b549-491374a650f3","token":null,"last_access":null,"last_page":null,"provider":"default","external_identifier":null,"auth_data":null,"email_notifications":true,"appearance":null,"theme_dark":null,"theme_light":null,"theme_light_overrides":null,"theme_dark_overrides":null,"text_direction":"auto","policies":[]}	{"role":"1a517210-06bd-4ba9-b549-491374a650f3"}	\N	\N
\.


--
-- Data for Name: directus_roles; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_roles (id, name, icon, description, parent) FROM stdin;
468a5eff-ce7f-4ecf-848f-f1ae8c549d20	Administrator	verified	$t:admin_description	\N
1a517210-06bd-4ba9-b549-491374a650f3	Agent	robot_2	\N	\N
\.


--
-- Data for Name: directus_sessions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_sessions (token, "user", expires, ip, user_agent, share, origin, next_token) FROM stdin;
kP8pdO3GLThXbzqXX_O1fMWy09D83NLkKRrferoavmns4Z0G8ztioyd6wXskCuQP	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 17:05:10.116+00	172.18.0.1	node	\N	\N	\N
-jPouSirrb-fmQsMgZKT9-i8PYPi0N19OP9HA8AJZEjxmgt67IuwCQSX_tJmc8By	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 17:26:34.351+00	172.18.0.1	node	\N	\N	\N
PSy3U63zK9-M9CY42TBpQ5yRwZrRpoloL96FdaHTUklEDAnk2VoYqDVbs03_GQ7n	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:35:33.528+00	172.18.0.1	node	\N	\N	\N
CHNOozyYcrChMeDXb2DT6JBixRsC0sc2d8IEULFp10HHKskLIYNfJ0etiD4Icokx	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 17:50:02.589+00	172.18.0.1	node	\N	\N	\N
jjQxnIoFZBnERED99Wfg28tcQI2yad4331gKNq_pKaf0o0079XrpoE3bZQ9CvOyb	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:43:28.166+00	172.18.0.1	node	\N	\N	\N
SqxvuC0IuW-QLOa2azTkHHBVIsxsAroUQXPG_6gCIqZ59QvxRHuuILjdHsnSUOYf	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:04:58.619+00	172.18.0.1	node	\N	\N	\N
LOEJgbnYYg035RuNa12vk3nFRUSYmkeuvIGp6Dh8PDZ6VDpm5yKoYN3Sri02u2uD	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:52:51.537+00	172.18.0.1	node	\N	\N	\N
56vfF-39p7TMWZbUgGnt9xibdf1tQl_zDf6ldb6Iwasy366dZVikq2WKVKqojmH8	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:53:14.676+00	172.18.0.1	node	\N	\N	\N
twAH-wvgPQWgqGrT-o4c7_oz8kES6GmSKYysLoEib2gZBRfGlvE_ImVcKFaUolKg	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:53:30.822+00	172.18.0.1	node	\N	\N	\N
msZI9D0sSR6ekypPRg1uqPoM3CNxx84yC7aFU9q2CZ9xPe4chP76WHUnUFy7_EcQ	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:56:04.244+00	172.18.0.1	node	\N	\N	\N
ZHqrgAw6YK_4iJ1FAn0c8rryUf-ctsXrrjHXThdMt5N2ubHN39kC8Kciua59wv5l	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:56:31.88+00	172.18.0.1	node	\N	\N	\N
QdtCt9-_tP7QdJzZkcMNapsdGkI7b-tU3lkxhkqb87Z5fDneWF96ExK6nD1T0rZ6	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 14:58:23.856+00	172.18.0.1	node	\N	\N	\N
2lqbBKq5dAnN3KGxjBvCuW9FXx7lHA8H15UOwMzId5BEJvONUrBnb-mnLV_7HAAu	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:11:03.625+00	172.18.0.1	node	\N	\N	\N
C8d9AocQ2llPLAo3fSV56pA_JqUhF7mT7ykE11NgdOJeZolbt7UmK7UylYcJhW3q	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:16:10.414+00	172.18.0.1	node	\N	\N	\N
THf-YOpQFkfSvSeDcdxw0BUx1OM0GAr9MyN0L-SgwusDcDphrIHNJ9gtGui6EYXF	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:16:30.888+00	172.18.0.1	node	\N	\N	\N
JO1-LHt4aOp5u05KI-C7XngPWZt12ffQGf8kF08_XFhvk1OS2M0aixdYITvhqIdz	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:16:44.959+00	172.18.0.1	node	\N	\N	\N
L9IfnAyemXV6wbEhO_3Pl-PtMnjL1nSdz9WnqBSovtz-BLUtNt4O2i9ZIE2U7ney	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:18:07.436+00	172.18.0.1	node	\N	\N	\N
8lLXztiiMdeRm0uaQapZTk5_u9uQrD6YLsIvUx_dOWbR3-GyLHdy25HDl43dXOXH	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:18:34.506+00	172.18.0.1	node	\N	\N	\N
GK2pYwweqSLCzgVWWojBvKQMudj01Ke3aqkTKLdKELuzFJYCfvbQN54xYmdedmW_	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:18:49.227+00	172.18.0.1	node	\N	\N	\N
bXhPiT1v_Th2iIXrF0n1NV44O0dQVM4Fe45eM0jNu1q3AO5ZyW3-hcIxPkqTJY7E	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:35:41.984+00	172.18.0.1	node	\N	\N	\N
mPy3R_UipUrASNayWG9QufOheSKY9KerSAiw4nO6eiKa8b9npjW1sX4muUOuAnF-	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:35:52.055+00	172.18.0.1	node	\N	\N	\N
7-Otg0uIY9RV8iuiyUM6eWvOVNnu3IiglrERWPuRyfCV1rsyyE6yxZyptT5NhyYf	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:36:02.685+00	172.18.0.1	node	\N	\N	\N
RtPW2DRDAs8OKDSroFaIi292TN3oAUhBvv9TTylVMCZfoBz2Duax5yNgr38z6kIZ	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:36:57.222+00	172.18.0.1	node	\N	\N	\N
lEZT1jn8bx3oKFHfWU8124qRKvgZduQXce-SXZBYhPGFQ72Q-5RvyhVSw42fd1Xk	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:37:36.416+00	172.18.0.1	node	\N	\N	\N
0LDeCaMlZ4bRTX0ARryRlGdsru1viFtOqQaZGNH24uYQeow0WZkBbDK9rPvIC1JI	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:38:09.498+00	172.18.0.1	node	\N	\N	\N
VyQ0Pb2O9wj57GuNFqpFsNyuXxirMRwTLThC4yfmd7YTLMEyWG7q5xqal9jiwDfz	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 15:38:26.321+00	172.18.0.1	node	\N	\N	\N
WWnZqoJQNYzfOhIXJbB0a_5yqtIl_pwNBeSO9zcGIJkL8wYBQYEEsnBlr9i3oRZl	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 16:19:45.194+00	172.18.0.1	node	\N	\N	\N
ewnoQl0MM1zSeq3w98gSNAQmcXPbW87nPu852sX9tozlfI5RYv4M28EeNBrHT1D3	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 16:35:27.598+00	172.18.0.1	node	\N	\N	\N
pR_XhK5KkqXmti1ne4wbkq3RjE8Ry-4G7YMkUo46kipvQVhg1NHxZbJs0R_Ofb0m	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 16:35:30.56+00	172.18.0.1	node	\N	\N	\N
7bQ3j9VwNle4ihoUv0cwSchtt6QgERMttUeG_NPGqam2iaCMBG9EmMnmiTjUkUfX	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 16:49:17.553+00	172.18.0.1	node	\N	\N	\N
plUTECfKAMqBpNKiURGN-Fgqw7m45hgYZEtYrsgWumSyczyIWQeLOn5_QqDj3IRo	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 16:50:08.888+00	172.18.0.1	node	\N	\N	\N
r-_BgTXDs-TzUVlLC7IQyiPzXeNRUSHwPEvjCaXUxg8Qi2N8Wp3RoO-s_Crc_9D9	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 17:04:17.654+00	172.18.0.1	node	\N	\N	\N
1T4yBhGW13I0WiiWjmYeRf2GcViT04WhuVxDgmcOCcctvdk0HEpNCaDYB3y-CXOC	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:30:41.657+00	172.18.0.1	node	\N	\N	\N
1m4bE62CDevRIcguFerduYMWa9oZ0PlMbub9g9AHRvo9wm2BlVgHlitrAu_MtKjR	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:05:12.067+00	172.18.0.1	node	\N	\N	\N
kwgDbDvltnI5wCE7fGkjTb-9JxE5ij_TxxgGNWcX0QwfmbSazla8d_hjh3J36V8-	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:05:55.812+00	172.18.0.1	node	\N	\N	\N
-3Gh3pbSjaKNGlzVaHuRwBjNI6qnVq6cNkSQvEyRS9Z1vNVje_r6OlcNdBH_mqka	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:30:42.395+00	172.18.0.1	node	\N	\N	\N
0pBxueeCAq75kZnCdufXm_dxlOUsEaWRtoi3s_6gvbBJobavYs8rU6D0NxjYfYUH	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:07:37.543+00	172.18.0.1	node	\N	\N	\N
dzjQPT_-ngTivgHYXWL5G73czb8oacs6nigFdATa4UIF8CxM2v_urwXbS-u5BEgd	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:13:55.422+00	172.18.0.1	node	\N	\N	\N
wgu_hdMaYje0Tv8TeOQL8Qe6z4QOkrzM9kqad4sRayTuUMMpvAPxlGzFY6Xwh7jh	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:14:12.496+00	172.18.0.1	node	\N	\N	\N
HMZIsxxFvbubAjRj1LiQLE3gbHyALoXMfNHrcA4cPdgxXQQmZQPb1BtrwyNDct_1	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:23:15.885+00	172.18.0.1	node	\N	\N	\N
rley7uMjQS1aRt7QbUw57xA-z8LfpPmmgppUifARr404tu-PYFiXFqW6MBXLfqbL	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:23:16.476+00	172.18.0.1	node	\N	\N	\N
M6aieCAxyT9KBHog0YMIeQmtz-q45RuF0NpJkPq5cl1_QsfWBQ-uNnYcTjkeii6H	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-27 18:30:58.282+00	172.18.0.1	node	\N	\N	\N
M_SmL6bVUq792XmzYX1-jd7NZhKVP76KoyQBOS1wzg8mJDieghj9DVaEzXjXv9Gc	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 00:47:32.316+00	172.18.0.1	node	\N	\N	\N
KmWKSNjJHvYKT99Mbmddnhx_E1mMzLRZ86B-5vOdkUpNw5QdNO6rpvMO-4XWzOum	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 00:33:37.15+00	172.18.0.1	node	\N	\N	\N
wyXv44B1u8cmKTXPAH10AvHpfQ0pAHPBhVdP8xrNL_uUEqk_xztTe5u7xUSPnUSl	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 00:35:54.893+00	172.18.0.1	node	\N	\N	\N
jqsgY6IVoQJpHe2vGIbBTT9YY4c5WgkNHhWFie5gIY_zrByT8jxdMaku8tvF0RZ8	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 00:48:31.514+00	172.18.0.1	node	\N	\N	\N
R76b8kY9oPfe6LrFYsDpt1T1N9g0B8k6OhFoJacVOTkbQr3I-tPMfAZtRkKv53-w	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 00:47:58.077+00	172.18.0.1	node	\N	\N	\N
5eGyLRP2zzseNMCp1FxSXB40OX09m428JqzoPnmagtGpje6PgQ0f1rTnJ67UmOM8	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:07:17.841+00	172.18.0.1	node	\N	\N	\N
U6cdkfFMfAL_opE933HTlpye_tHenTuqqgaS-E67YylO56XorBgJdnq9neSc9LCU	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:07:46.879+00	172.18.0.1	node	\N	\N	\N
40GMxrWjPkeXmZ2iMjoddTguazbhcuIgXv3ORU7VIy1kxo8UGbmK8asa0YYsrAqt	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:07:46.878+00	172.18.0.1	node	\N	\N	\N
Kx8O2CtGtrRYuAFifyO2QUUQaroibnaAY3_cJv93mgTNVV5nznIJOv6AwWCcVbga	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 02:13:29.341+00	172.18.0.1	node	\N	\N	\N
EAh5G044-GPjtO8A85xi-m53nVD9r4Utlt2h3-leonyFI9SHMLoZQoKr0ZIf61Nw	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 02:13:50.845+00	172.18.0.1	node	\N	\N	\N
XOgWzwpgigc_ElGosVo4pWlHiD73vYkbjTRahxE67cM5ya0ZLpfiLw3GekaZKdun	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-23 02:15:51.939+00	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	\N	http://localhost:8055	\N
djhZl1hHkwQmKw6TvPbVuisiPT_9QwuKm09KC6LBt_NbEZm4EGJaQpeZHYvVr-_B	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 02:29:33.577+00	172.18.0.1	node	\N	\N	\N
cLJiMAyWNcCXuf-NN6bK0CylK3ylBsirSjwqSDreKcmyPVn2Vpd1bolWenz2dzCr	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 02:46:06.884+00	172.18.0.1	node	\N	\N	\N
zscLt7xeQEg-6WVOpHD-S69WbPqeKDltb0DJZT-FOrbJonJurtt40mgyFin1yPRy	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:21:41.906+00	172.18.0.1	node	\N	\N	\N
9xRYsIqFfje0MQoLhpq5YwbHIJGhqBx1HDXf0aBBJlX4Wi_ncqnlVDE59GXxTyo-	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:22:04.951+00	172.18.0.1	node	\N	\N	\N
3xYYXdwyv18L9M1wRmTGf1zLGVcqxvdxTpxrCVH7fYV-2ZbdNsHnE97STKUUoj2Y	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:23:04.36+00	172.18.0.1	node	\N	\N	\N
4VJZINGDaCeVPqHSsWMDKlYVFAI9zCLuLz208bk70plIbEKw2_tr1kad4LU7GImD	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 03:02:27.914+00	172.18.0.1	node	\N	\N	\N
2vnZnAK9ndKgmk8Y-I7fS5sI8RT1kYauvk1w_2ZE10r_jlHv34PD118aBzJVoDKL	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:39:26.999+00	172.18.0.1	node	\N	\N	\N
uwdG9TJtWd_9YExzrD2h3fOQHV-4h8rkdqr8HA1LlLSBjtRArnQno_28e3o7nPqN	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:55:23.05+00	172.18.0.1	node	\N	\N	\N
n7hjPCRGGgSPOhma4uXeRJFAyL50T7jaZRXylo1S2eLrhSzt4rXC16WHSAe4diSn	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 01:55:23.213+00	172.18.0.1	node	\N	\N	\N
HTOqhGLuTYeg3t9eDt4mWPq3FpnfE6ieLCRTA2-T_SwcLYTExlBlsU_-IKbtJqH9	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 02:03:58.189+00	172.18.0.1	curl/8.7.1	\N	\N	\N
S_KsTYalO4O0hE08vWV_PH2m_bNc_7wNn6BeKDjpcZ3a6dLg6L8cQ_mlDizP0T3I	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 03:02:27.921+00	172.18.0.1	node	\N	\N	\N
gy-yw_GODn0P66_FYRzVEtRmFa4ZvUfNyvNTbowAISADele3s-wnpk-g3h6tmLpi	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 03:19:51.506+00	172.18.0.1	node	\N	\N	\N
VXw1C-B2N3rP6eHgHLJG0Yh92st6S6-xd9OK4juqwzfxuvxXGsnvX1WN7fuKZkMB	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 03:49:41.726+00	172.18.0.1	node	\N	\N	\N
7YxuK8z86ga3w7Bh5bUSXbcFqJR7D4nQm83hztII1_WlfwJa4gZ7jm6ZJBRyxCPr	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 04:04:58.874+00	172.18.0.1	node	\N	\N	\N
cEjRUNsccVKnZkkVzSZtXvTIsiFLm_BM7y1Muz9CnXjKe7y82nB36tMUmceZKZNg	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 04:21:57.213+00	172.18.0.1	node	\N	\N	\N
Qghi8urZVGYOeu_g1IGPnMsBzSqkL9gqftEKZXAifml5o9A6pyQKTWhb8BNWXs21	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 04:40:26.968+00	172.18.0.1	node	\N	\N	\N
lwreChFlOCTEgidZ8DZzSfusTlfPbhZgfT7OwZWHwyS12Ik-B3oqEynpvglK3uqj	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 04:40:26.974+00	172.18.0.1	node	\N	\N	\N
SYmfVIsGufqJSBa-7VPTdie8ETY0GRNDf5UD4-k72LYvYeM-B1z9lgzuGlWIpqGe	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 04:56:09.116+00	172.18.0.1	node	\N	\N	\N
Vz4dPjao5ej-h_Pocy2PZp_3nH2q8eEK-kJu9ZGvqnr9gyRp7TMrh7Mn00bJGEev	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 05:09:06.869+00	172.18.0.1	node	\N	\N	\N
kxSBwveg9aBoS2tTIw4x1sr8bzQmnly4uOS92SFYnD1hgVE3LTAkG3vn5lB6IoRl	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 05:09:06.873+00	172.18.0.1	node	\N	\N	\N
0jRDZrWpYqoa5juokap8pZvdFApKyjh7BxMTGzbdPOW-jgAkSlPk7ugOBkpYRxV_	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 05:09:34.646+00	172.18.0.1	node	\N	\N	\N
2JqFCozkKZOb4K4hcYR7oGfsRLno1Lywr8fIGQ_b_mCqT-Ai0dUyj6soeSwEOpye	b33b41c7-4075-4a71-94ca-20bc6ebfc634	2026-03-29 05:09:34.647+00	172.18.0.1	node	\N	\N	\N
\.


--
-- Data for Name: directus_settings; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_settings (id, project_name, project_url, project_color, project_logo, public_foreground, public_background, public_note, auth_login_attempts, auth_password_policy, storage_asset_transform, storage_asset_presets, custom_css, storage_default_folder, basemaps, mapbox_key, module_bar, project_descriptor, default_language, custom_aspect_ratios, public_favicon, default_appearance, default_theme_light, theme_light_overrides, default_theme_dark, theme_dark_overrides, report_error_url, report_bug_url, report_feature_url, public_registration, public_registration_verify_email, public_registration_role, public_registration_email_filter, visual_editor_urls, project_id, mcp_enabled, mcp_allow_deletes, mcp_prompts_collection, mcp_system_prompt_enabled, mcp_system_prompt, project_owner, project_usage, org_name, product_updates, project_status, ai_openai_api_key, ai_anthropic_api_key, ai_system_prompt, ai_google_api_key, ai_openai_compatible_api_key, ai_openai_compatible_base_url, ai_openai_compatible_name, ai_openai_compatible_models, ai_openai_compatible_headers, ai_openai_allowed_models, ai_anthropic_allowed_models, ai_google_allowed_models, collaborative_editing_enabled) FROM stdin;
1	Directus	\N	#6644FF	\N	\N	\N	\N	25	\N	all	\N	\N	\N	\N	\N	\N	\N	en-US	\N	\N	auto	\N	\N	\N	\N	\N	\N	\N	f	t	\N	\N	\N	019cbf9c-6588-7587-92f0-72128037caba	f	f	\N	t	\N	atefalvi@gmail.com	personal	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	["gpt-5-nano","gpt-5-mini","gpt-5"]	["claude-haiku-4-5","claude-sonnet-4-5"]	["gemini-3-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash"]	f
\.


--
-- Data for Name: directus_shares; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_shares (id, name, collection, item, role, password, user_created, date_created, date_start, date_end, times_used, max_uses) FROM stdin;
\.


--
-- Data for Name: directus_translations; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_translations (id, language, key, value) FROM stdin;
\.


--
-- Data for Name: directus_users; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_users (id, first_name, last_name, email, password, location, title, description, tags, avatar, language, tfa_secret, status, role, token, last_access, last_page, provider, external_identifier, auth_data, email_notifications, appearance, theme_dark, theme_light, theme_light_overrides, theme_dark_overrides, text_direction) FROM stdin;
b33b41c7-4075-4a71-94ca-20bc6ebfc634	Admin	User	atefalvi@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$xeEAsRBs+PQzhUlM8GTskw$h0lU/F1s4tzXbLFBl0yX4qNkayG0xuHwxDwV96QFcSY	\N	\N	\N	\N	69291d43-21d7-423e-9055-921330fe0b16	\N	\N	active	468a5eff-ce7f-4ecf-848f-f1ae8c549d20	\N	2026-03-22 05:09:34.651+00	/settings/data-model	default	\N	\N	t	\N	\N	\N	\N	\N	auto
210c2d58-f85a-4f9f-a333-3230b096a70c	Agent	Clerk	atefsagent@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$EkqFTfAi6ZI9Ju8UoZZ5dg$UTBfM6uO1tPjENwi14LGPzxcFM61/eDP7CYqqUM2btc	\N	\N	\N	\N	\N	en-CA	\N	active	1a517210-06bd-4ba9-b549-491374a650f3	\N	\N	\N	default	\N	\N	t	\N	\N	\N	\N	\N	auto
\.


--
-- Data for Name: directus_versions; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.directus_versions (id, key, name, collection, item, hash, date_created, date_updated, user_created, user_updated, delta) FROM stdin;
\.


--
-- Data for Name: home_settings; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.home_settings (id, hero_tagline_1, hero_tagline_2, hero_tagline_3) FROM stdin;
1	CONVERTING SIGNAL TO INTELLIGENCE.	FULL STACK ANALYTICS & HOMELAB OPERATIONS.	CURRENTLY TRAINING NEURAL NETS.
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.logs (id, title, slug, excerpt, content, published_at, tag, category, log_number, series_label) FROM stdin;
2	Designing with Brutalism	designing-brutalism	Exploring the philosophy behind Data Dreamer v3 aesthetic.	<p>Aesthetic matters. Brutalism brings raw data to the forefront.</p>\n<p>| Component &nbsp; &nbsp; &nbsp; &nbsp;| Type &nbsp; &nbsp; &nbsp; &nbsp;| Description &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Example / Value &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Status &nbsp; | Notes &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>|-----------------|------------|--------------------------------------------------|------------------------------|----------|--------------------------------|<br>| Header &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| Layout &nbsp; &nbsp; &nbsp;| Top navigation bar with branding &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Header /&gt;` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Fixed, global component &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Project Card &nbsp; &nbsp;| Component &nbsp; | Displays project preview with image + metadata &nbsp; | `.project-card` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uses grayscale hover &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Renderer &nbsp; | System &nbsp; &nbsp; &nbsp;| Maps CMS blocks to UI components &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `&lt;Code /&gt;`, `&lt;Quote /&gt;` &nbsp; &nbsp; &nbsp;| ⚙️ WIP &nbsp; &nbsp;| Uses Directus block editor &nbsp; &nbsp; |<br>| Primary Color &nbsp; | Token &nbsp; &nbsp; &nbsp; | Main brand color &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `#FF2E00` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Used for accents/interactions &nbsp;|<br>| Font (Heading) &nbsp;| Typography &nbsp;| Heading font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `Anton` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| ✅ Active | Uppercase only &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Font (Body) &nbsp; &nbsp; | Typography &nbsp;| Body font &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| `JetBrains Mono` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ✅ Active | Developer-style text &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Cursor Effect &nbsp; | Interaction | Global trailing mouse halo &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | Canvas-based &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | ⚙️ WIP &nbsp; &nbsp;| Must not flicker &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| Blog Page &nbsp; &nbsp; &nbsp; | Page &nbsp; &nbsp; &nbsp; &nbsp;| Blog detail view &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `/blog/[slug]` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | 🚧 Draft &nbsp;| Includes sidebar &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |<br>| API Endpoint &nbsp; &nbsp;| Backend &nbsp; &nbsp; | CMS endpoint &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | `http://localhost:8055` &nbsp; &nbsp; &nbsp;| ✅ Active | Directus instance &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|<br>| Docs Link &nbsp; &nbsp; &nbsp; | Reference &nbsp; | External documentation &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | [Directus Docs](https://directus.io/docs) | 📎 Link &nbsp; | Useful for SDK usage &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |</p>	2026-03-20 16:49:18.129+00	Design	Opinion	2	Design series
3	Optimizing Astro for Scale	optimizing-astro	How to handle thousands of dynamic routes.	<p>Astro provides excellent scaling capabilities, especially when paired with a good CMS.</p>	2026-03-20 16:49:18.151+00	Architecture	Tutorial	3	Directus series
1	The Future of Agentic Coding	future-agentic-coding	How AI agents are reshaping the software development lifecycle.	<h2>The Future of Agentic Coding</h2>\n<p>This is a test log entry demonstrating that callouts now work even in the <strong>WYSIWYG</strong> editor.</p>\n<p>:::info PRO TIP</p>\n<p>You can now type your callouts directly into the rich text editor and they will be beautifully rendered!</p>\n<p>:::</p>\n<h2>Key Advantages</h2>\n<ul>\n<li>Real-time updates via SSR</li>\n<li>WYSIWYG compatibility</li>\n<li>Premium aesthetics</li>\n</ul>\n<p>:::warning CAUTION</p>\n<p>Make sure to close your blocks with a triple colon on its own line.</p>\n<p>:::</p>\n<p>End of transmission.</p>\n<h2>Key Advantages</h2>\n<ol>\n<li>Real-time updates via SSR</li>\n<li>WYSIWYG compatibility</li>\n<li>Premium aesthetics</li>\n</ol>	2026-03-20 14:43:29.727+00	AI	Article	1	Agent series
4	The Ultimate Component Test	ultimate-component-test	Testing all custom markdown components in the WYSIWYG editor.	\n<h2>Introduction</h2>\n\n<p>This post contains every single component we have built to ensure they all render correctly inside the WYSIWYG editor.</p>\n\n<p>:::info THE BASICS</p>\n<p>This is a standard info callout. It helps draw attention to standard information.</p>\n<p>:::</p>\n\n<p>:::warning CRITICAL</p>\n<p>This is a warning callout. It should have a red/orange tint if styled, or at least be distinct.</p>\n<p>:::</p>\n\n<p>:::tip HELPFUL</p>\n<p>This is a tip callout.</p>\n<p>:::</p>\n\n<p>:::note REMINDER</p>\n<p>This is a note callout.</p>\n<p>:::</p>\n\n<h2>The Pull Quote</h2>\n\n<p>:::quote</p>\n<p>Agentic coding represents the largest paradigm shift since the invention of the high-level programming language.</p>\n<p>:::</p>\n\n<h2>Expandable Blocks</h2>\n\n<p>:::details Click to reveal a secret</p>\n<p>This content is hidden by default and requires the user to interact with the details element to expand it.</p>\n<p>Great for hiding long logs or extra context.</p>\n<p>:::</p>\n\n<h2>Images inside Markdown</h2>\n\n<p>Here is an image added via markdown:</p>\n<img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Retro computer setup">\n\n<p>End of test log.</p>\n	2026-03-20 16:49:18.159+00	Testing	QA	4	\N
5	Structured Complexity	structured-complexity-tables	Organizing data efficiently using Markdown tables in a Brutalist aesthetic.	\n<h2>Why Tables Matter</h2>\n\n<p>When presenting complex analytical data, plain text is not enough. We need structured, rigid, brutalist tables.</p>\n\n<p>Here is an example of a system performance report:</p>\n\n| Component | Status | Latency (ms) | Notes |\n| :--- | :---: | :---: | :--- |\n| **API Gateway** | <span style="color:#00ff87">Online</span> | 42 | Operating normally. |\n| **Directus DB** | <span style="color:#00ff87">Online</span> | 18 | Indexed queries optimized. |\n| **Astro SSR** | <span style="color:var(--color-primary)">Warning</span> | 150 | High load detected. |\n| **Worker Node** | <span style="color:#0088ff">Idle</span> | 5 | Waiting for tasks. |\n\n<h2>Model Comparison</h2>\n\n| Model | Parameters | Context Window | Best For |\n| :--- | :---: | :---: | :--- |\n| Claude 3.5 Sonnet | N/A | 200k | Agentic coding, complex reasoning |\n| GPT-4o | N/A | 128k | Multimodal tasks, swift responses |\n| Llama 3 (8B) | 8B | 8k | Local execution, lightweight scripting |\n| Mistral Large | N/A | 32k | General purpose enterprise logic |\n\n<p>:::tip Formatting</p>\n<p>Markdown tables are fully supported. You can align columns using colons in the header divider row!</p>\n<p>:::</p>\n	2026-03-20 17:04:18.244+00	Data	Tutorial	5	Formatting Guides
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.projects (id, title, slug, summary, description, cover_image, tags, published_at, featured) FROM stdin;
1	Project Phoenix	project-phoenix	A revolutionary data processing engine built with Astro and Directus.	<h2>The Architectural Core</h2>\n<p>Project Phoenix leverages a distributed graph topology to optimize inference latency across heterogeneous compute clusters.</p>\n<h3>Core Technology</h3>\n<ul>\n<li>Distributed Graph Neural Networks</li>\n<li>Real-time Vector Ingestion</li>\n<li>Low-latency Edge Inference</li>\n</ul>\n<p>:::tip This is Tip</p>\n<p>This is a helpful tip</p>\n<p>:::</p>\n<p>&nbsp;</p>	6491c577-8815-410e-bfd6-f357a97ac186	["AI","Data Engineering","Directus"]	2026-03-20 14:43:29.716+00	t
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.site_settings (id, status_text, email, github, linkedin, footer_cta_heading, twitter) FROM stdin;
1	SYSTEMS ONLINE (SSR ENABLED)	hello@data-dreamer.net	github.com/atefalvi	linkedin.com/in/syedatef	READY TO PROCESS DATA?	twitter.com/data_dreamer
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: directus
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: directus
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: directus
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: directus
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: directus
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: directus
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: directus
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: about_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.about_id_seq', 1, true);


--
-- Name: directus_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_activity_id_seq', 211, true);


--
-- Name: directus_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_fields_id_seq', 36, true);


--
-- Name: directus_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_notifications_id_seq', 1, false);


--
-- Name: directus_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_permissions_id_seq', 7, true);


--
-- Name: directus_presets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_presets_id_seq', 2, true);


--
-- Name: directus_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_relations_id_seq', 5, true);


--
-- Name: directus_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_revisions_id_seq', 125, true);


--
-- Name: directus_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.directus_settings_id_seq', 1, true);


--
-- Name: home_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.home_settings_id_seq', 1, true);


--
-- Name: logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.logs_id_seq', 5, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: directus
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 1, true);


--
-- Name: about about_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.about
    ADD CONSTRAINT about_pkey PRIMARY KEY (id);


--
-- Name: directus_access directus_access_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_pkey PRIMARY KEY (id);


--
-- Name: directus_activity directus_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_activity
    ADD CONSTRAINT directus_activity_pkey PRIMARY KEY (id);


--
-- Name: directus_collections directus_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_pkey PRIMARY KEY (collection);


--
-- Name: directus_comments directus_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_pkey PRIMARY KEY (id);


--
-- Name: directus_dashboards directus_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_pkey PRIMARY KEY (id);


--
-- Name: directus_deployment_projects directus_deployment_projects_deployment_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_projects
    ADD CONSTRAINT directus_deployment_projects_deployment_external_id_unique UNIQUE (deployment, external_id);


--
-- Name: directus_deployment_projects directus_deployment_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_projects
    ADD CONSTRAINT directus_deployment_projects_pkey PRIMARY KEY (id);


--
-- Name: directus_deployment_runs directus_deployment_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_runs
    ADD CONSTRAINT directus_deployment_runs_pkey PRIMARY KEY (id);


--
-- Name: directus_deployments directus_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployments
    ADD CONSTRAINT directus_deployments_pkey PRIMARY KEY (id);


--
-- Name: directus_deployments directus_deployments_provider_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployments
    ADD CONSTRAINT directus_deployments_provider_unique UNIQUE (provider);


--
-- Name: directus_extensions directus_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_extensions
    ADD CONSTRAINT directus_extensions_pkey PRIMARY KEY (id);


--
-- Name: directus_fields directus_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_fields
    ADD CONSTRAINT directus_fields_pkey PRIMARY KEY (id);


--
-- Name: directus_files directus_files_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_pkey PRIMARY KEY (id);


--
-- Name: directus_flows directus_flows_operation_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_operation_unique UNIQUE (operation);


--
-- Name: directus_flows directus_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_pkey PRIMARY KEY (id);


--
-- Name: directus_folders directus_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_pkey PRIMARY KEY (id);


--
-- Name: directus_migrations directus_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_migrations
    ADD CONSTRAINT directus_migrations_pkey PRIMARY KEY (version);


--
-- Name: directus_notifications directus_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_pkey PRIMARY KEY (id);


--
-- Name: directus_operations directus_operations_reject_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_unique UNIQUE (reject);


--
-- Name: directus_operations directus_operations_resolve_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_unique UNIQUE (resolve);


--
-- Name: directus_panels directus_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_pkey PRIMARY KEY (id);


--
-- Name: directus_permissions directus_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_pkey PRIMARY KEY (id);


--
-- Name: directus_policies directus_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_policies
    ADD CONSTRAINT directus_policies_pkey PRIMARY KEY (id);


--
-- Name: directus_presets directus_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_pkey PRIMARY KEY (id);


--
-- Name: directus_relations directus_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_relations
    ADD CONSTRAINT directus_relations_pkey PRIMARY KEY (id);


--
-- Name: directus_revisions directus_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_pkey PRIMARY KEY (id);


--
-- Name: directus_roles directus_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_pkey PRIMARY KEY (id);


--
-- Name: directus_sessions directus_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_pkey PRIMARY KEY (token);


--
-- Name: directus_settings directus_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_pkey PRIMARY KEY (id);


--
-- Name: directus_shares directus_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_pkey PRIMARY KEY (id);


--
-- Name: directus_translations directus_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_translations
    ADD CONSTRAINT directus_translations_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_email_unique UNIQUE (email);


--
-- Name: directus_users directus_users_external_identifier_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_external_identifier_unique UNIQUE (external_identifier);


--
-- Name: directus_users directus_users_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_pkey PRIMARY KEY (id);


--
-- Name: directus_users directus_users_token_unique; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_token_unique UNIQUE (token);


--
-- Name: directus_versions directus_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_pkey PRIMARY KEY (id);


--
-- Name: home_settings home_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.home_settings
    ADD CONSTRAINT home_settings_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: directus_activity_timestamp_index; Type: INDEX; Schema: public; Owner: directus
--

CREATE INDEX directus_activity_timestamp_index ON public.directus_activity USING btree ("timestamp");


--
-- Name: directus_revisions_activity_index; Type: INDEX; Schema: public; Owner: directus
--

CREATE INDEX directus_revisions_activity_index ON public.directus_revisions USING btree (activity);


--
-- Name: directus_revisions_parent_index; Type: INDEX; Schema: public; Owner: directus
--

CREATE INDEX directus_revisions_parent_index ON public.directus_revisions USING btree (parent);


--
-- Name: about about_profile_image_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.about
    ADD CONSTRAINT about_profile_image_foreign FOREIGN KEY (profile_image) REFERENCES public.directus_files(id);


--
-- Name: about about_resume_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.about
    ADD CONSTRAINT about_resume_foreign FOREIGN KEY (resume) REFERENCES public.directus_files(id);


--
-- Name: directus_access directus_access_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_access directus_access_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_access
    ADD CONSTRAINT directus_access_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_collections directus_collections_group_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_collections
    ADD CONSTRAINT directus_collections_group_foreign FOREIGN KEY ("group") REFERENCES public.directus_collections(collection);


--
-- Name: directus_comments directus_comments_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_comments directus_comments_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_comments
    ADD CONSTRAINT directus_comments_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: directus_dashboards directus_dashboards_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_dashboards
    ADD CONSTRAINT directus_dashboards_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_deployment_projects directus_deployment_projects_deployment_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_projects
    ADD CONSTRAINT directus_deployment_projects_deployment_foreign FOREIGN KEY (deployment) REFERENCES public.directus_deployments(id) ON DELETE CASCADE;


--
-- Name: directus_deployment_projects directus_deployment_projects_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_projects
    ADD CONSTRAINT directus_deployment_projects_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_deployment_runs directus_deployment_runs_project_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_runs
    ADD CONSTRAINT directus_deployment_runs_project_foreign FOREIGN KEY (project) REFERENCES public.directus_deployment_projects(id) ON DELETE CASCADE;


--
-- Name: directus_deployment_runs directus_deployment_runs_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployment_runs
    ADD CONSTRAINT directus_deployment_runs_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_deployments directus_deployments_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_deployments
    ADD CONSTRAINT directus_deployments_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_folder_foreign FOREIGN KEY (folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_files directus_files_modified_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_modified_by_foreign FOREIGN KEY (modified_by) REFERENCES public.directus_users(id);


--
-- Name: directus_files directus_files_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.directus_users(id);


--
-- Name: directus_flows directus_flows_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_flows
    ADD CONSTRAINT directus_flows_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_folders directus_folders_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_folders
    ADD CONSTRAINT directus_folders_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_folders(id);


--
-- Name: directus_notifications directus_notifications_recipient_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_recipient_foreign FOREIGN KEY (recipient) REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_notifications directus_notifications_sender_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_notifications
    ADD CONSTRAINT directus_notifications_sender_foreign FOREIGN KEY (sender) REFERENCES public.directus_users(id);


--
-- Name: directus_operations directus_operations_flow_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_flow_foreign FOREIGN KEY (flow) REFERENCES public.directus_flows(id) ON DELETE CASCADE;


--
-- Name: directus_operations directus_operations_reject_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_reject_foreign FOREIGN KEY (reject) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_resolve_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_resolve_foreign FOREIGN KEY (resolve) REFERENCES public.directus_operations(id);


--
-- Name: directus_operations directus_operations_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_operations
    ADD CONSTRAINT directus_operations_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_panels directus_panels_dashboard_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_dashboard_foreign FOREIGN KEY (dashboard) REFERENCES public.directus_dashboards(id) ON DELETE CASCADE;


--
-- Name: directus_panels directus_panels_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_panels
    ADD CONSTRAINT directus_panels_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_permissions directus_permissions_policy_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_permissions
    ADD CONSTRAINT directus_permissions_policy_foreign FOREIGN KEY (policy) REFERENCES public.directus_policies(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_presets directus_presets_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_presets
    ADD CONSTRAINT directus_presets_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_activity_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_activity_foreign FOREIGN KEY (activity) REFERENCES public.directus_activity(id) ON DELETE CASCADE;


--
-- Name: directus_revisions directus_revisions_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_revisions(id);


--
-- Name: directus_revisions directus_revisions_version_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_revisions
    ADD CONSTRAINT directus_revisions_version_foreign FOREIGN KEY (version) REFERENCES public.directus_versions(id) ON DELETE CASCADE;


--
-- Name: directus_roles directus_roles_parent_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_roles
    ADD CONSTRAINT directus_roles_parent_foreign FOREIGN KEY (parent) REFERENCES public.directus_roles(id);


--
-- Name: directus_sessions directus_sessions_share_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_share_foreign FOREIGN KEY (share) REFERENCES public.directus_shares(id) ON DELETE CASCADE;


--
-- Name: directus_sessions directus_sessions_user_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_sessions
    ADD CONSTRAINT directus_sessions_user_foreign FOREIGN KEY ("user") REFERENCES public.directus_users(id) ON DELETE CASCADE;


--
-- Name: directus_settings directus_settings_project_logo_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_project_logo_foreign FOREIGN KEY (project_logo) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_background_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_background_foreign FOREIGN KEY (public_background) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_favicon_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_favicon_foreign FOREIGN KEY (public_favicon) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_foreground_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_foreground_foreign FOREIGN KEY (public_foreground) REFERENCES public.directus_files(id);


--
-- Name: directus_settings directus_settings_public_registration_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_public_registration_role_foreign FOREIGN KEY (public_registration_role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_settings directus_settings_storage_default_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_settings
    ADD CONSTRAINT directus_settings_storage_default_folder_foreign FOREIGN KEY (storage_default_folder) REFERENCES public.directus_folders(id) ON DELETE SET NULL;


--
-- Name: directus_shares directus_shares_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE CASCADE;


--
-- Name: directus_shares directus_shares_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_shares
    ADD CONSTRAINT directus_shares_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_users directus_users_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_users
    ADD CONSTRAINT directus_users_role_foreign FOREIGN KEY (role) REFERENCES public.directus_roles(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_collection_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_collection_foreign FOREIGN KEY (collection) REFERENCES public.directus_collections(collection) ON DELETE CASCADE;


--
-- Name: directus_versions directus_versions_user_created_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: directus_versions directus_versions_user_updated_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.directus_versions
    ADD CONSTRAINT directus_versions_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


--
-- Name: projects projects_cover_image_foreign; Type: FK CONSTRAINT; Schema: public; Owner: directus
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_cover_image_foreign FOREIGN KEY (cover_image) REFERENCES public.directus_files(id);


--
-- PostgreSQL database dump complete
--

