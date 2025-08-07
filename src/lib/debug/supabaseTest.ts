import { supabaseClient } from '@/lib/supabase/client';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check auth session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    console.log('📋 Session check:', {
      hasSession: !!session,
      user: session?.user?.id,
      error: sessionError?.message
    });

    // Test 2: Check user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('👤 User check:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: userError?.message
    });

    // Test 3: Try to fetch projects table (should work even if empty)
    const { data: projects, error: projectError } = await supabaseClient
      .from('projects')
      .select('id, name')
      .limit(1);
    
    console.log('🗃️ Database check:', {
      hasAccess: !projectError,
      projectCount: projects?.length || 0,
      error: projectError?.message
    });

    return {
      authWorking: !!user && !userError,
      databaseWorking: !projectError,
      user: user
    };
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return {
      authWorking: false,
      databaseWorking: false,
      user: null
    };
  }
};

// Helper function to debug project creation
export const debugProjectCreation = async (projectData: any) => {
  console.log('🧪 Debug: Testing project creation...');
  
  const connectionTest = await testSupabaseConnection();
  
  if (!connectionTest.authWorking) {
    console.error('❌ Auth not working, cannot create project');
    return false;
  }

  if (!connectionTest.databaseWorking) {
    console.error('❌ Database access not working');
    return false;
  }

  console.log('✅ Prerequisites met, attempting project creation...');
  console.log('📦 Project data:', projectData);
  
  try {
    const { data, error } = await supabaseClient
      .from('projects')
      .insert([{
        ...projectData,
        user_id: connectionTest.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Project creation failed:', error);
      return false;
    }

    console.log('✅ Project created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception during project creation:', error);
    return false;
  }
};
