class Templates {

	private static _instance: Templates;

	private readonly templatePaths = [
		// Add paths to "modules/fvvt-roll-stats/templates"
	];

    private constructor() {
    }

    public static getInstance(): Templates {
        if (!Templates._instance) Templates._instance = new Templates();
        return Templates._instance;
    }

	public preloadTemplates = async function() {
		return loadTemplates(this.templatePaths);
	}
}

export default Templates.getInstance();
