ARCHIVE = archive.zip
BUILD = index.html

$(ARCHIVE): $(BUILD)
	zip $@ $(BUILD)

$(BUILD): src.js vs.glsl fs.glsl
	bash index.html.sh > $(BUILD)

clean:
	rm -f $(ARCHIVE) $(BUILD)

live: $(BUILD)
	scp $(BUILD) hhsw.de@ssh.strato.de:sites/proto/js13k2016/
