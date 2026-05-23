set appName to "PulseMIDI"

set confirmResult to button returned of (display dialog "Are you sure you want to uninstall " & appName & "?" & return & return & "This will remove:" & return & "  • PulseMIDI.app" & return & "  • pulsemidi-vst.vst3 (VST3 plugin)" & return & "  • pulsemidi-vst.clap (CLAP plugin)" & return & "  • Uninstall PulseMIDI.app" buttons {"Cancel", "Uninstall"} default button "Cancel" with icon caution with title "Uninstall PulseMIDI")

if confirmResult is "Uninstall" then
	set removeCmd to "rm -rf '/Applications/PulseMIDI.app' '/Library/Audio/Plug-Ins/VST3/pulsemidi-vst.vst3' '/Library/Audio/Plug-Ins/CLAP/pulsemidi-vst.clap'; rm -rf '/Applications/Uninstall PulseMIDI.app'"
	try
		do shell script removeCmd with administrator privileges
		display dialog appName & " has been uninstalled successfully." buttons {"OK"} default button "OK" with title "Uninstall PulseMIDI"
	on error errMsg
		display dialog "Uninstall failed:" & return & errMsg buttons {"OK"} default button "OK" with icon stop with title "Uninstall PulseMIDI"
	end try
end if
