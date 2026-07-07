import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material'
import { Close, Download, PictureAsPdf } from '@mui/icons-material'
import { Document, Page, PDFViewer, StyleSheet, Text, View } from '@react-pdf/renderer'
import { useSettings } from '../hooks/use-settings'

// Executive Shadow AI report: tenant data pages interleaved with explainer ("filler") pages that
// put shadow AI risk in business terms, mirroring the executive report's structure.
const ShadowAIReportDocument = ({ tenantName, data, brandColor }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const summary = data?.summary ?? {}
  const detectedApps = data?.detectedApps ?? []
  const consentedApps = data?.consentedApps ?? []
  const topTools = data?.topTools ?? []
  const byCategory = data?.byCategory ?? []

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.4,
      color: '#2D3748',
      padding: 40,
    },
    coverPage: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      padding: 60,
      justifyContent: 'space-between',
      minHeight: '100%',
    },
    coverLabel: {
      backgroundColor: brandColor,
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 30,
      alignSelf: 'flex-start',
    },
    coverTitle: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#1A202C',
      marginBottom: 12,
    },
    coverSubtitle: {
      fontSize: 16,
      color: '#4A5568',
      marginBottom: 6,
    },
    coverFooter: {
      fontSize: 9,
      color: '#718096',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionLabel: {
      fontSize: 9,
      fontWeight: 'bold',
      color: brandColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1A202C',
      marginBottom: 14,
    },
    subheading: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#1A202C',
      marginTop: 14,
      marginBottom: 6,
    },
    paragraph: {
      fontSize: 10,
      color: '#4A5568',
      marginBottom: 10,
      lineHeight: 1.6,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      marginHorizontal: 4,
      padding: 12,
      backgroundColor: '#F7FAFC',
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: brandColor,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1A202C',
    },
    statLabel: {
      fontSize: 8,
      color: '#718096',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 4,
    },
    riskCard: {
      padding: 12,
      backgroundColor: '#F7FAFC',
      borderRadius: 6,
      marginBottom: 10,
      borderLeftWidth: 3,
    },
    riskTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1A202C',
      marginBottom: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: brandColor,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginBottom: 2,
    },
    tableHeaderCell: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    tableCell: {
      fontSize: 8,
      color: '#4A5568',
    },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: '#A0AEC0',
    },
  })

  const PageFooter = () => (
    <View style={styles.footer} fixed>
      <Text>{tenantName} - Shadow AI Report</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )

  const riskLevels = [
    {
      name: 'High',
      color: '#E53E3E',
      text: 'Consumer tools that train on submitted data, retain prompts indefinitely, or operate from jurisdictions without adequate data protection. Content pasted into these tools should be treated as disclosed to an unvetted third party.',
    },
    {
      name: 'Medium',
      color: '#DD6B20',
      text: 'Tools with business-grade privacy options that are typically used through personal, unmanaged accounts. Risk depends heavily on the plan and account type in use.',
    },
    {
      name: 'Low',
      color: '#3182CE',
      text: 'Tools with enterprise controls, contractual data-processing terms and no training on customer data when configured correctly.',
    },
    {
      name: 'Informational',
      color: '#38A169',
      text: 'Company sanctioned tools. These have been explicitly approved for use in this tenant; they remain in the report for visibility but do not contribute to the risk figures.',
    },
  ]

  const recommendations = [
    'Review this report with stakeholders and decide, per detected tool, whether it should be sanctioned, replaced with an approved alternative, or blocked.',
    'Mark approved tools as Company Sanctioned in CIPP so future reports separate approved AI use from true shadow AI.',
    'Provide a sanctioned alternative (such as Microsoft 365 Copilot or an enterprise AI subscription) before blocking popular tools - blocking without an alternative drives usage to personal devices.',
    'Restrict user consent for unverified applications in Entra ID so new AI services require admin approval before they can access company data.',
    'Deploy Conditional Access and Defender for Cloud Apps policies to block or monitor unsanctioned AI web services.',
    'Extend data loss prevention policies to cover generative AI endpoints, preventing sensitive data from being pasted into chat prompts.',
    'Communicate an acceptable AI use policy to end users and train them on what data may never be shared with AI tools.',
    'Re-run this report monthly: the AI tool landscape changes quickly and new tools appear in tenants within days of release.',
  ]

  const detectedRows = detectedApps.slice(0, 22)
  const consentedRows = consentedApps.slice(0, 22)

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>
            {currentDate}
          </Text>
        </View>
        <View>
          <Text style={styles.coverLabel}>Confidential</Text>
          <Text style={styles.coverTitle}>Shadow AI Report</Text>
          <Text style={styles.coverSubtitle}>{tenantName}</Text>
          <Text style={{ fontSize: 11, color: '#718096', marginTop: 10 }}>
            Discovery and risk assessment of AI tools in use across managed devices and cloud
            applications.
          </Text>
        </View>
        <View>
          <Text style={styles.coverFooter}>Generated with CIPP</Text>
        </View>
      </Page>

      {/* Executive summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Executive Summary</Text>
        <Text style={styles.heading}>AI Usage at a Glance</Text>
        <Text style={styles.paragraph}>
          This report identifies the artificial intelligence tools discovered in the {tenantName}{' '}
          environment, combining software inventory from managed devices (Intune) with cloud
          application consent data from Entra ID. Each tool is matched against a curated catalog of
          known AI services and assigned a risk level. Tools that have been explicitly approved are
          marked as company sanctioned and report the Informational risk level.
        </Text>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary.aiToolsDetected ?? 0}</Text>
            <Text style={styles.statLabel}>AI Tools Detected</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary.deviceInstalls ?? 0}</Text>
            <Text style={styles.statLabel}>Device Installs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{summary.consentedAiApps ?? 0}</Text>
            <Text style={styles.statLabel}>AI Apps in Entra</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#E53E3E' }]}>
              {summary.highRiskTools ?? 0}
            </Text>
            <Text style={styles.statLabel}>High-Risk Tools</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#38A169' }]}>
              {summary.sanctionedTools ?? 0}
            </Text>
            <Text style={styles.statLabel}>Sanctioned Tools</Text>
          </View>
        </View>
        {topTools.length > 0 && (
          <>
            <Text style={styles.subheading}>Most Used AI Tools</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Tool</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Device Installs</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Users (7 Days)</Text>
            </View>
            {topTools.map((tool) => (
              <View style={styles.tableRow} key={tool.tool}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{tool.tool}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{tool.category}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{tool.status ?? 'Unsanctioned'}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{tool.devices}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{tool.users}</Text>
              </View>
            ))}
          </>
        )}
        {byCategory.length > 0 && (
          <>
            <Text style={styles.subheading}>Tools by Category</Text>
            {byCategory.map((category) => (
              <View style={styles.tableRow} key={category.category}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{category.category}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{category.tools}</Text>
              </View>
            ))}
          </>
        )}
        <PageFooter />
      </Page>

      {/* Filler: understanding shadow AI */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Background</Text>
        <Text style={styles.heading}>Understanding Shadow AI</Text>
        <Text style={styles.paragraph}>
          Shadow AI is the use of artificial intelligence tools by employees without the knowledge
          or approval of the organization - the AI-era equivalent of shadow IT. Because most AI
          tools are free, browser-based and immediately useful, adoption happens quietly and
          quickly: an employee pastes a customer email into a chatbot to draft a reply, uploads a
          spreadsheet for analysis, or installs an AI notetaker that joins every meeting.
        </Text>
        <Text style={styles.subheading}>Why it matters</Text>
        <Text style={styles.paragraph}>
          Every prompt is a data transfer to a third party. When staff use personal accounts on
          consumer AI tools, company data leaves the tenant with no contract, no audit trail and no
          way to recall it. The main risk areas:
        </Text>
        <View style={[styles.riskCard, { borderLeftColor: '#E53E3E' }]}>
          <Text style={styles.riskTitle}>Data leakage</Text>
          <Text style={styles.paragraph}>
            Customer records, credentials, source code and financials pasted into consumer AI tools
            may be retained by the provider and used to train future models, permanently placing
            them outside the organization's control.
          </Text>
        </View>
        <View style={[styles.riskCard, { borderLeftColor: '#DD6B20' }]}>
          <Text style={styles.riskTitle}>Compliance and legal exposure</Text>
          <Text style={styles.paragraph}>
            Processing personal data through unvetted AI services can breach GDPR, HIPAA and
            industry-specific regulations, and undermines contractual confidentiality commitments to
            customers.
          </Text>
        </View>
        <View style={[styles.riskCard, { borderLeftColor: '#D69E2E' }]}>
          <Text style={styles.riskTitle}>Excessive application permissions</Text>
          <Text style={styles.paragraph}>
            AI meeting assistants and productivity plugins often request broad access to mailboxes,
            calendars and files. A single user consent can expose organization-wide data to a
            third-party service - and that access persists until the consent is revoked.
          </Text>
        </View>
        <View style={[styles.riskCard, { borderLeftColor: '#3182CE' }]}>
          <Text style={styles.riskTitle}>Unreliable output in business processes</Text>
          <Text style={styles.paragraph}>
            AI-generated content flows into quotes, contracts and customer communication without
            review. Errors and fabrications produced by unmanaged tools are difficult to trace
            because the organization does not know the tools are in use.
          </Text>
        </View>
        <PageFooter />
      </Page>

      {/* Filler: risk levels */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Methodology</Text>
        <Text style={styles.heading}>How Risk Levels Are Assigned</Text>
        <Text style={styles.paragraph}>
          Detected tools are matched against a curated catalog of known AI services, each carrying a
          risk classification based on its data handling practices, account model and enterprise
          controls. Marking a tool as company sanctioned overrides its catalog risk with the
          Informational level, so the risk figures in this report reflect only unapproved use.
        </Text>
        {riskLevels.map((level) => (
          <View style={[styles.riskCard, { borderLeftColor: level.color }]} key={level.name}>
            <Text style={[styles.riskTitle, { color: level.color }]}>{level.name}</Text>
            <Text style={styles.paragraph}>{level.text}</Text>
          </View>
        ))}
        <Text style={styles.subheading}>Sanctioned versus unsanctioned</Text>
        <Text style={styles.paragraph}>
          Every detected tool carries a status: Sanctioned tools have been explicitly approved for
          this tenant, while Unsanctioned tools represent shadow AI - usage that has not been
          reviewed or approved. The goal of a shadow AI program is not zero AI usage, but zero
          unsanctioned usage: every tool in this report should end up either approved and managed,
          or replaced and blocked.
        </Text>
        <PageFooter />
      </Page>

      {/* Data: detected software */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Discovery Data</Text>
        <Text style={styles.heading}>AI Software on Managed Devices</Text>
        <Text style={styles.paragraph}>
          AI applications found in the Intune software inventory of managed devices
          {detectedApps.length > detectedRows.length
            ? ` (showing ${detectedRows.length} of ${detectedApps.length} entries)`
            : ''}
          .
        </Text>
        {detectedRows.length === 0 ? (
          <Text style={styles.paragraph}>No AI software was detected on managed devices.</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Application</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>AI Tool</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Risk</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Devices</Text>
            </View>
            {detectedRows.map((app, index) => (
              <View style={styles.tableRow} key={`${app.application}-${index}`}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{app.application}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{app.aiTool}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{app.category}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{app.risk}</Text>
                <Text style={[styles.tableCell, { flex: 2.5 }]}>{app.status}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{app.deviceCount}</Text>
              </View>
            ))}
          </>
        )}
        <PageFooter />
      </Page>

      {/* Data: Entra applications */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Discovery Data</Text>
        <Text style={styles.heading}>AI Applications in Entra ID</Text>
        <Text style={styles.paragraph}>
          AI services registered as applications in the tenant, including any permissions users have
          consented to
          {consentedApps.length > consentedRows.length
            ? ` (showing ${consentedRows.length} of ${consentedApps.length} entries)`
            : ''}
          .
        </Text>
        {consentedRows.length === 0 ? (
          <Text style={styles.paragraph}>No AI applications were found in Entra ID.</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Application</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>AI Tool</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Risk</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Users (7 Days)</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>First Consented</Text>
            </View>
            {consentedRows.map((app, index) => (
              <View style={styles.tableRow} key={`${app.applicationId}-${index}`}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{app.application}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{app.aiTool}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{app.risk}</Text>
                <Text style={[styles.tableCell, { flex: 2.5 }]}>{app.status}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{app.activeUsersLast7Days}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {app.firstConsentedDateTime
                    ? new Date(app.firstConsentedDateTime).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </View>
            ))}
          </>
        )}
        <PageFooter />
      </Page>

      {/* Recommendations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionLabel}>Next Steps</Text>
        <Text style={styles.heading}>Recommendations</Text>
        <Text style={styles.paragraph}>
          A structured response to shadow AI combines approval of useful tools with controls on the
          rest. The following actions are recommended based on the findings in this report:
        </Text>
        {recommendations.map((recommendation, index) => (
          <View
            key={index}
            style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: brandColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>{index + 1}</Text>
            </View>
            <Text style={[styles.paragraph, { flex: 1, marginBottom: 0 }]}>{recommendation}</Text>
          </View>
        ))}
        <PageFooter />
      </Page>
    </Document>
  )
}

export const ShadowAIReportButton = ({ data, tenantName, disabled }) => {
  const settings = useSettings()
  const brandColor = settings.customBranding?.colour || '#F77F00'
  const [previewOpen, setPreviewOpen] = useState(false)

  const fileName = `Shadow_AI_Report_${String(tenantName).replace(/[^a-zA-Z0-9]/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`

  const reportDocument = useMemo(() => {
    if (!previewOpen) return null
    return <ShadowAIReportDocument tenantName={tenantName} data={data} brandColor={brandColor} />
  }, [previewOpen, tenantName, data, brandColor])

  return (
    <>
      <Tooltip title="Generate an executive report about AI usage and shadow AI risk in this tenant">
        <span>
          <Button
            size="small"
            variant="outlined"
            disabled={disabled}
            onClick={() => setPreviewOpen(true)}
            startIcon={
              <SvgIcon fontSize="small">
                <PictureAsPdf />
              </SvgIcon>
            }
          >
            Executive Shadow AI Report
          </Button>
        </span>
      </Tooltip>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: '95vh', maxHeight: '95vh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" component="div">
            Shadow AI Report - {tenantName}
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {reportDocument && (
            <PDFViewer
              key={`shadow-ai-pdf-viewer-${Date.now()}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              showToolbar={true}
            >
              {reportDocument}
            </PDFViewer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => {
              const downloadDocument = (
                <ShadowAIReportDocument
                  tenantName={tenantName}
                  data={data}
                  brandColor={brandColor}
                />
              )
              import('@react-pdf/renderer').then(({ pdf }) => {
                pdf(downloadDocument)
                  .toBlob()
                  .then((blob) => {
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = fileName
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  })
                  .catch((error) => {
                    console.error('Error generating Shadow AI PDF:', error)
                  })
              })
            }}
          >
            Download PDF
          </Button>
          <Button onClick={() => setPreviewOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
