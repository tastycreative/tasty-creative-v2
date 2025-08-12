import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Extended interface for cell data with chipRuns (undocumented Google Sheets API feature)
interface ExtendedCellData {
  hyperlink?: string;
  chipRuns?: Array<{
    chip?: {
      richLinkProperties?: {
        uri?: string;
        mimeType?: string;
      };
    };
  }>;
  [key: string]: unknown;
}

// Extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const { spreadsheetUrl, rowNumber = 8 } = await request.json();

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: "Spreadsheet URL is required" },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL" },
        { status: 400 }
      );
    }

    // Define the ranges to fetch data from a specific row
    const ranges = [
      `C${rowNumber}`, // Team name
      `D${rowNumber}`, // Spreadsheet URL
      `E${rowNumber}`, // Team members (comma-separated in single cell)
      `F${rowNumber}`, // Creators (comma-separated in single cell)
    ];

    try {
      // Fetch data from multiple ranges
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      // Get cell data with hyperlinks for column D using spreadsheets.get
      let hyperlinkUrl = "";
      try {
        const cellResponse = await sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
          includeGridData: true,
          ranges: [`D${rowNumber}:D${rowNumber}`],
        });

        if (cellResponse.data.sheets && cellResponse.data.sheets.length > 0) {
          const sheet = cellResponse.data.sheets[0];
          if (sheet.data && sheet.data.length > 0) {
            const gridData = sheet.data[0];
            if (gridData.rowData && gridData.rowData.length > 0) {
              const row = gridData.rowData[0];
              if (row.values && row.values.length > 0) {
                const cell = row.values[0] as ExtendedCellData;

                // Check for traditional hyperlink
                if (cell && cell.hyperlink) {
                  hyperlinkUrl = cell.hyperlink;
                }
                // Check for smart chip links in chipRuns
                else if (
                  cell &&
                  cell.chipRuns &&
                  Array.isArray(cell.chipRuns)
                ) {
                  for (const chipRun of cell.chipRuns) {
                    if (
                      chipRun.chip &&
                      chipRun.chip.richLinkProperties &&
                      chipRun.chip.richLinkProperties.uri
                    ) {
                      hyperlinkUrl = chipRun.chip.richLinkProperties.uri;
                      break; // Use the first link found
                    }
                  }
                }
              }
            }
          }
        }
      } catch (hyperlinkError) {
        console.error(
          "Error extracting hyperlink from cell data:",
          hyperlinkError
        );
      }

      const values = response.data.valueRanges;

      // Fetch sheet links if we have a valid spreadsheet URL
      const sheetLinks: Array<{ name: string; url: string }> = [];
      if (hyperlinkUrl) {
        try {
          const linkedSpreadsheetId = extractSpreadsheetId(hyperlinkUrl);
          if (linkedSpreadsheetId) {
            // Fetch column K to find "Sheet Links" and get items below it
            const linksResponse = await sheets.spreadsheets.values.get({
              spreadsheetId: linkedSpreadsheetId,
              range: "K:K", // Get entire column K
            });

            const columnKValues = linksResponse.data.values || [];
            console.log("Column K values found:", columnKValues.length, "rows");

            // Log first few values for debugging
            columnKValues.slice(0, 10).forEach((row, index) => {
              if (row[0]) {
                console.log(`Row ${index + 1}:`, row[0]);
              }
            });

            // Find the row with "Sheet Links" (may contain emoji and could be in a merged cell)
            // Check more rows since merged cells might affect the search
            let sheetLinksRowIndex = -1;
            const rowsToSearchForHeader = Math.min(50, columnKValues.length); // Search first 50 rows for the header

            for (let i = 0; i < rowsToSearchForHeader; i++) {
              if (columnKValues[i] && columnKValues[i][0]) {
                const cellValue = columnKValues[i][0].toString().trim();
                // Check if the cell contains "Sheet Links" (case insensitive, handles emojis)
                if (cellValue.toLowerCase().includes("sheet links")) {
                  sheetLinksRowIndex = i;
                  console.log(
                    "Found Sheet Links at row:",
                    i + 1,
                    "with value:",
                    cellValue
                  );
                  break;
                }
              }
            }

            // Get all non-empty values below "Sheet Links" and extract hyperlinks from smart chips
            if (sheetLinksRowIndex !== -1) {
              console.log(
                "Starting to collect all links from row:",
                sheetLinksRowIndex + 2
              );

              // Get grid data for the range below Sheet Links to access hyperlinks
              const sheetLinksGridResponse = await sheets.spreadsheets.get({
                spreadsheetId: linkedSpreadsheetId,
                includeGridData: true,
                ranges: [
                  `K${sheetLinksRowIndex + 2}:K${Math.min(columnKValues.length, sheetLinksRowIndex + 50)}`,
                ], // Get up to 50 rows of data
              });

              // Extract hyperlinks from grid data
              if (
                sheetLinksGridResponse.data.sheets &&
                sheetLinksGridResponse.data.sheets.length > 0
              ) {
                const sheet = sheetLinksGridResponse.data.sheets[0];
                if (sheet.data && sheet.data.length > 0) {
                  const gridData = sheet.data[0];
                  if (gridData.rowData) {
                    gridData.rowData.forEach((row, index) => {
                      if (row.values && row.values.length > 0) {
                        const cell = row.values[0] as ExtendedCellData;

                        const cellLinks: Array<{ name: string; url: string }> =
                          [];

                        // Get display text from the values API
                        const actualRowIndex = sheetLinksRowIndex + 1 + index;
                        let displayText = "";
                        if (
                          columnKValues[actualRowIndex] &&
                          columnKValues[actualRowIndex][0]
                        ) {
                          displayText = columnKValues[actualRowIndex][0]
                            .toString()
                            .trim();
                        }

                        // Split display text by | to get individual names
                        const displayNames = displayText
                          .split("|")
                          .map((name) => name.trim())
                          .filter((name) => name);

                        // Collect all smart chip URLs from this cell
                        const smartChipUrls: string[] = [];

                        // Check for traditional hyperlink
                        if (cell && cell.hyperlink) {
                          smartChipUrls.push(cell.hyperlink);
                        }

                        // Check for smart chip links in chipRuns (there might be multiple)
                        if (
                          cell &&
                          cell.chipRuns &&
                          Array.isArray(cell.chipRuns)
                        ) {
                          for (const chipRun of cell.chipRuns) {
                            if (
                              chipRun.chip &&
                              chipRun.chip.richLinkProperties &&
                              chipRun.chip.richLinkProperties.uri
                            ) {
                              smartChipUrls.push(
                                chipRun.chip.richLinkProperties.uri
                              );
                            }
                          }
                        }

                        // Create link entries - pair display names with URLs
                        if (
                          displayNames.length > 0 &&
                          smartChipUrls.length > 0
                        ) {
                          // Create a unique identifier for this cell group
                          const cellGroupId = `cell-${actualRowIndex}`;

                          // If we have multiple names and multiple URLs, pair them up
                          if (
                            displayNames.length > 1 &&
                            smartChipUrls.length > 1
                          ) {
                            displayNames.forEach((name, nameIndex) => {
                              const linkEntry = {
                                name: name,
                                url:
                                  smartChipUrls[nameIndex] ||
                                  smartChipUrls[0] ||
                                  "", // Use corresponding URL or first URL as fallback
                                cellGroup: cellGroupId, // Add group identifier
                              };
                              cellLinks.push(linkEntry);
                            });
                          } else {
                            // If we have multiple names but only one URL, create separate entries with the same URL
                            displayNames.forEach((name) => {
                              const linkEntry = {
                                name: name,
                                url: smartChipUrls[0] || "",
                                cellGroup: cellGroupId, // Add group identifier
                              };
                              cellLinks.push(linkEntry);
                            });
                          }
                        }

                        // If we have URLs but no proper display names, use generic names
                        if (
                          cellLinks.length === 0 &&
                          smartChipUrls.length > 0
                        ) {
                          smartChipUrls.forEach((url, urlIndex) => {
                            cellLinks.push({
                              name: displayText || `Sheet ${urlIndex + 1}`,
                              url: url,
                            });
                          });
                        }

                        // Add all links from this cell to the main array
                        cellLinks.forEach((link) => {
                          sheetLinks.push(link);
                          console.log(
                            `Row ${actualRowIndex + 1}: Added link: "${link.name}" -> ${link.url || "no URL"}`
                          );
                        });
                      }
                    });
                  }
                }
              }

              console.log("Total sheet links found:", sheetLinks.length);
            } else {
              console.log(
                "Sheet Links header not found in column K within first",
                rowsToSearchForHeader,
                "rows"
              );
            }
          }
        } catch (sheetLinksError) {
          console.error("Error fetching sheet links:", sheetLinksError);
        }
      }

      if (!values || values.length < 4) {
        return NextResponse.json(
          { error: "Could not fetch data from spreadsheet" },
          { status: 500 }
        );
      }

      // Parse team name (C{rowNumber})
      const teamNameRange = values[0];
      const teamName = teamNameRange?.values?.[0]?.[0] || `Team ${rowNumber}`;

      // Parse spreadsheet URL (D{rowNumber}) - use hyperlink if available, otherwise display text
      const spreadsheetUrlRange = values[1];
      const displayText = spreadsheetUrlRange?.values?.[0]?.[0] || "";
      const schedulerSpreadsheetUrl = hyperlinkUrl || displayText;

      // Parse team members (E{rowNumber}) - comma-separated
      const teamMembersRange = values[2];
      const teamMembersString = teamMembersRange?.values?.[0]?.[0] || "";
      const teamMembers = teamMembersString
        .split(",")
        .map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name: name.trim(),
          role:
            index === 0 ? "Team Lead" : index === 1 ? "Designer" : "Developer",
        }))
        .filter(
          (member: { id: string; name: string; role: string }) =>
            member.name !== ""
        );

      // Parse creators (F{rowNumber}) - comma-separated
      const creatorsRange = values[3];
      const creatorsString = creatorsRange?.values?.[0]?.[0] || "";
      const creators = creatorsString
        .split(",")
        .map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name: name.trim(),
          specialty: index === 0 ? "$15,000" : "$18,500", // Default values, you can make these dynamic too
        }))
        .filter(
          (creator: { id: string; name: string; specialty: string }) =>
            creator.name !== ""
        );

      // Return the parsed data
      return NextResponse.json({
        success: true,
        data: {
          teamName,
          teamMembers,
          creators,
          schedulerSpreadsheetUrl,
          sheetLinks,
          rowNumber,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (sheetsError) {
      console.error("Error fetching from Google Sheets:", sheetsError);
      return NextResponse.json(
        { error: "Failed to access Google Sheets. Please check permissions." },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error in POD fetch API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
