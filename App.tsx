
import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import TextAreaInput from './components/TextAreaInput';

const App: React.FC = () => {
    const [mainData, setMainData] = useState<string>('');
    const [gamesToRemove, setGamesToRemove] = useState<string>('');
    const [gamesToAdd, setGamesToAdd] = useState<string>('');
    const [initialGameFeed, setInitialGameFeed] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGameFeedLoading, setIsGameFeedLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const parseGameList = (rawText: string): string[] => {
        let processableText = rawText;
        const colonIndex = rawText.indexOf(':');
        if (colonIndex > -1) {
            processableText = rawText.substring(colonIndex + 1);
        }
        return processableText.split(',').map(g => g.trim()).filter(Boolean);
    };

    const handleProcessAndDownload = () => {
        setError(null);
        if (!mainData || !gamesToRemove || !gamesToAdd) {
            setError("Please fill in all data fields (1, 2, 3) before processing.");
            return;
        }

        setIsLoading(true);
        try {
            const gamesToSetFalse = parseGameList(gamesToRemove);
            const gamesToSetTrue = parseGameList(gamesToAdd);

            const lines = mainData.trim().split('\n');
            if (lines.length < 2) {
                throw new Error("Main data must contain a header and at least one data row.");
            }
            
            const separator = lines[0].includes('\t') ? '\t' : ',';

            const headerRow = lines[0].split(separator);
            const dataRows = lines.slice(1).map(line => line.split(separator));

            const nameIndex = headerRow.indexOf('name');
            const isGamePopularIndex = headerRow.indexOf('isGamePopular');

            if (nameIndex === -1 || isGamePopularIndex === -1) {
                throw new Error("Could not find 'name' and/or 'isGamePopular' columns in the main data. Please check the header row.");
            }

            const updatedRowsData: string[][] = [];
            dataRows.forEach(row => {
                if(row.length !== headerRow.length) return; 
                
                const gameName = row[nameIndex]?.trim();
                if (!gameName) return;

                let updated = false;

                if (gamesToSetFalse.includes(gameName)) {
                    row[isGamePopularIndex] = 'FALSE';
                    updated = true;
                } else if (gamesToSetTrue.includes(gameName)) {
                    row[isGamePopularIndex] = 'TRUE';
                    updated = true;
                }

                if (updated) {
                    updatedRowsData.push(row);
                }
            });

            if (updatedRowsData.length === 0) {
                throw new Error("No matching games were found in the main data to update.");
            }

            const csvHeader = headerRow.join(separator);
            const csvRows = updatedRowsData.map(row => row.join(separator));
            const csvContent = [csvHeader, ...csvRows].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "updated_drops_and_wins.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessGameFeed = () => {
        setError(null);
        if (!mainData || !gamesToRemove || !gamesToAdd || !initialGameFeed) {
            setError("Please ensure all four data fields are filled before processing the game feed.");
            return;
        }
        setIsGameFeedLoading(true);
        try {
            // 1. Create a map of game names to game codes from the main data
            const mainLines = mainData.trim().split('\n');
            const mainSeparator = mainLines[0].includes('\t') ? '\t' : ',';
            const mainHeader = mainLines[0].split(mainSeparator);
            const nameIndex = mainHeader.indexOf('name');
            const gameCodeIndex = mainHeader.indexOf('gameCode');

            if (nameIndex === -1 || gameCodeIndex === -1) {
                throw new Error("Could not find 'name' and/or 'gameCode' columns in the main data.");
            }

            const gameNameToCodeMap = new Map<string, string>();
            mainLines.slice(1).forEach(line => {
                const row = line.split(mainSeparator);
                if (row[nameIndex] && row[gameCodeIndex]) {
                    gameNameToCodeMap.set(row[nameIndex].trim(), row[gameCodeIndex].trim());
                }
            });

            // 2. Parse game lists for addition and removal
            const gamesToRemoveSet = new Set(parseGameList(gamesToRemove));
            const gamesToAddList = parseGameList(gamesToAdd);

            // 3. Check if all games to be added exist in the main data
            for (const game of gamesToAddList) {
                if (!gameNameToCodeMap.has(game)) {
                    throw new Error(`Game to add "${game}" was not found in the main data. Cannot retrieve its gameCode.`);
                }
            }
            
            // 4. Parse the initial game feed to get a list of current game names
            const feedLines = initialGameFeed.trim().split('\n');
            const feedSeparator = feedLines.length > 0 && feedLines[0].includes('\t') ? '\t' : ',';
            const feedHeader = feedLines[0].split(feedSeparator);
            const feedNameIndex = feedHeader.findIndex(h => h.toLowerCase().trim() === 'name');
            
            if (feedNameIndex === -1) {
                 throw new Error("Could not find a 'name' column in the initial game feed data.");
            }

            const initialGameNames = feedLines.slice(1)
                .map(line => line.split(feedSeparator)[feedNameIndex]?.trim())
                .filter(Boolean);

            // 5. Process the lists
            let processedGameNames = initialGameNames.filter(name => !gamesToRemoveSet.has(name));
            processedGameNames.push(...gamesToAddList);

            // Use a Set to ensure uniqueness while preserving insertion order for added items
            const finalGameNameSet = new Set(processedGameNames);

            // 6. Generate the new CSV content
            const csvHeader = "name,gameCode";
            const csvRows = Array.from(finalGameNameSet).map(name => {
                const code = gameNameToCodeMap.get(name) || '';
                // Enclose names in quotes if they contain commas to prevent CSV corruption
                const formattedName = name.includes(',') ? `"${name}"` : name;
                return `${formattedName},${code}`;
            });

            const csvContent = [csvHeader, ...csvRows].join('\n');

            // 7. Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "game_feed.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unexpected error occurred while processing the game feed.");
            }
        } finally {
            setIsGameFeedLoading(false);
        }
    };


    return (
      <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col">
        <Header />
        <main className="container mx-auto p-4 md:p-8 flex-grow">
            <div className="max-w-4xl mx-auto bg-slate-800/50 p-6 rounded-lg shadow-xl border border-slate-700">
                <div className="text-center mb-6">
                    <p className="text-lg text-gray-400">Paste in portal game data for Pragmatic Play games only</p>
                </div>
                
                {error && (
                    <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    <TextAreaInput 
                        id="main-data"
                        label="1. Paste Full Game Data"
                        value={mainData}
                        onChange={(e) => setMainData(e.target.value)}
                        placeholder="Paste the entire CSV or tab-separated data here, including the header row..."
                        rows={10}
                    />
                    <TextAreaInput 
                        id="games-to-remove"
                        label="2. Games to remove Drops & Wins Sash"
                        value={gamesToRemove}
                        onChange={(e) => setGamesToRemove(e.target.value)}
                        placeholder="e.g., Gates of Olympus, Sweet Bonanza, Chilli Heat..."
                        rows={4}
                    />
                    <TextAreaInput 
                        id="games-to-add"
                        label="3. Games to add Drops & Wins Sash"
                        value={gamesToAdd}
                        onChange={(e) => setGamesToAdd(e.target.value)}
                        placeholder="e.g., Zombie School Megaways, Starlight Wins, Argonauts..."
                        rows={4}
                    />
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleProcessAndDownload}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        {isLoading ? 'Processing...' : 'Process & Download game CSV'}
                    </button>
                </div>

                <hr className="my-10 border-slate-700" />

                <div className="space-y-6">
                     <TextAreaInput 
                        id="initial-game-feed"
                        label="4. Paste Initial Game Feed List"
                        value={initialGameFeed}
                        onChange={(e) => setInitialGameFeed(e.target.value)}
                        placeholder="Paste the initial game feed list (with a 'name' column) here..."
                        rows={10}
                    />
                </div>
                 <div className="mt-8 text-center">
                    <button
                        onClick={handleProcessGameFeed}
                        disabled={isGameFeedLoading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        {isGameFeedLoading ? 'Processing...' : 'Process & Download Game feed CSV'}
                    </button>
                </div>

            </div>
        </main>
        <Footer />
      </div>
    );
};
export default App;
