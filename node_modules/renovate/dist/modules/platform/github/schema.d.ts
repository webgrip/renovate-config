import { z } from "zod/v4";

//#region lib/modules/platform/github/schema.d.ts
declare const GithubVulnerabilityAlerts: z.ZodPipe<z.ZodType<{
  security_advisory: {
    ghsa_id: string;
    summary: string;
    description: string;
    identifiers: {
      type: string;
      value: string;
    }[];
    severity: "low" | "medium" | "high" | "critical";
    references?: {
      url: string;
    }[] | undefined;
    cvss_severities?: {
      cvss_v3?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
      cvss_v4?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
    } | null | undefined;
  };
  security_vulnerability: {
    package: {
      ecosystem: "composer" | "maven" | "npm" | "rust" | "go" | "rubygems" | "nuget" | "actions" | "pip";
      name: string;
    };
    severity: "low" | "medium" | "high" | "critical";
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    } | null | undefined;
  } | null;
  dependency: {
    manifest_path: string;
  };
  dismissed_reason?: string | null | undefined;
}[], any, z.core.$ZodTypeInternals<{
  security_advisory: {
    ghsa_id: string;
    summary: string;
    description: string;
    identifiers: {
      type: string;
      value: string;
    }[];
    severity: "low" | "medium" | "high" | "critical";
    references?: {
      url: string;
    }[] | undefined;
    cvss_severities?: {
      cvss_v3?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
      cvss_v4?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
    } | null | undefined;
  };
  security_vulnerability: {
    package: {
      ecosystem: "composer" | "maven" | "npm" | "rust" | "go" | "rubygems" | "nuget" | "actions" | "pip";
      name: string;
    };
    severity: "low" | "medium" | "high" | "critical";
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    } | null | undefined;
  } | null;
  dependency: {
    manifest_path: string;
  };
  dismissed_reason?: string | null | undefined;
}[], any>>, z.ZodTransform<{
  security_advisory: {
    ghsa_id: string;
    summary: string;
    description: string;
    identifiers: {
      type: string;
      value: string;
    }[];
    severity: "low" | "medium" | "high" | "critical";
    references?: {
      url: string;
    }[] | undefined;
    cvss_severities?: {
      cvss_v3?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
      cvss_v4?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
    } | null | undefined;
  };
  security_vulnerability: {
    package: {
      ecosystem: "composer" | "maven" | "npm" | "rust" | "go" | "rubygems" | "nuget" | "actions" | "pip";
      name: string;
    };
    severity: "low" | "medium" | "high" | "critical";
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    } | null | undefined;
  } | null;
  dependency: {
    manifest_path: string;
  };
  dismissed_reason?: string | null | undefined;
}[], {
  security_advisory: {
    ghsa_id: string;
    summary: string;
    description: string;
    identifiers: {
      type: string;
      value: string;
    }[];
    severity: "low" | "medium" | "high" | "critical";
    references?: {
      url: string;
    }[] | undefined;
    cvss_severities?: {
      cvss_v3?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
      cvss_v4?: {
        vector_string: string | null;
        score: number | null;
      } | null | undefined;
    } | null | undefined;
  };
  security_vulnerability: {
    package: {
      ecosystem: "composer" | "maven" | "npm" | "rust" | "go" | "rubygems" | "nuget" | "actions" | "pip";
      name: string;
    };
    severity: "low" | "medium" | "high" | "critical";
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    } | null | undefined;
  } | null;
  dependency: {
    manifest_path: string;
  };
  dismissed_reason?: string | null | undefined;
}[]>>;
type GithubVulnerabilityAlerts = z.infer<typeof GithubVulnerabilityAlerts>;
type GithubVulnerabilityAlert = GithubVulnerabilityAlerts[number];
//#endregion
export { GithubVulnerabilityAlert };
//# sourceMappingURL=schema.d.ts.map